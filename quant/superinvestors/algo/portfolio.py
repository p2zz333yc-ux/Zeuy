"""Construction du portefeuille cible à partir des scores.

Trois décisions, dans cet ordre : *lesquels* (sélection par le score),
*combien* (pondération inverse à la volatilité, plafonnée), *quelle dose*
(mise à l'échelle sur la volatilité cible, le reste en liquidités).
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ..analysis.themes import macro_bucket
from ..data.models import Universe
from .risk import (
    RiskConfig,
    apply_caps,
    crowding_discount,
    diversification_ratio,
    portfolio_vol,
    volatility_scaling,
)
from .scoring import ScoredAsset, eligible_assets


@dataclass(frozen=True)
class Position:
    """Une ligne du portefeuille cible."""

    ticker: str
    name: str
    sector: str
    bucket: str
    weight: float          # fraction du portefeuille total (liquidités incluses)
    score: float
    holder_count: int
    holders: tuple[str, ...]
    reason: str

    @property
    def weight_pct(self) -> float:
        return self.weight * 100.0


@dataclass
class TargetPortfolio:
    """Portefeuille proposé, avec tout ce qu'il faut pour le contester."""

    positions: tuple[Position, ...]
    cash_weight: float
    gross_exposure: float
    unlevered_vol: float
    expected_vol: float
    diversification: float
    warnings: tuple[str, ...] = ()
    config: RiskConfig = field(default_factory=RiskConfig)

    def weights(self) -> dict[str, float]:
        return {p.ticker: p.weight for p in self.positions}

    def sector_exposures(self) -> dict[str, float]:
        out: dict[str, float] = {}
        for position in self.positions:
            out[position.sector] = out.get(position.sector, 0.0) + position.weight
        return dict(sorted(out.items(), key=lambda kv: -kv[1]))

    def bucket_exposures(self) -> dict[str, float]:
        out: dict[str, float] = {}
        for position in self.positions:
            out[position.bucket] = out.get(position.bucket, 0.0) + position.weight
        return dict(sorted(out.items(), key=lambda kv: -kv[1]))


def build_target_portfolio(
    universe: Universe,
    scored: list[ScoredAsset],
    *,
    risk_config: RiskConfig | None = None,
    n_positions: int = 15,
) -> TargetPortfolio:
    """Assemble le portefeuille cible à partir du classement."""
    config = risk_config or RiskConfig()
    selected = eligible_assets(scored)[:n_positions]
    if not selected:
        return TargetPortfolio((), 1.0, 0.0, 0.0, 0.0, 0.0, ("aucun titre éligible",), config)

    floor = min(s.score for s in selected)
    discounts = crowding_discount(config, {s.ticker: s.crowding for s in selected})
    raw: dict[str, float] = {}
    for asset in selected:
        # Score ramené en territoire positif, pondération inverse à la
        # volatilité (à conviction égale, on préfère le titre le moins
        # agité), puis décote d'encombrement.
        strength = (asset.score - floor) + 0.10
        raw[asset.ticker] = (
            strength / universe.asset(asset.ticker).vol * discounts[asset.ticker]
        )

    capped, warnings = apply_caps(universe, raw, config)

    unlevered_vol = portfolio_vol(universe, capped, config)
    exposure = volatility_scaling(unlevered_vol, config)
    diversification = diversification_ratio(universe, capped, config)

    by_ticker = {s.ticker: s for s in selected}
    positions = tuple(
        Position(
            ticker=ticker,
            name=universe.asset(ticker).name,
            sector=universe.asset(ticker).sector,
            bucket=macro_bucket(universe.asset(ticker).theme),
            weight=weight * exposure,
            score=by_ticker[ticker].score,
            holder_count=by_ticker[ticker].holder_count,
            holders=tuple(h.manager_name for h in by_ticker[ticker].holders),
            reason=by_ticker[ticker].top_reason(),
        )
        for ticker, weight in sorted(capped.items(), key=lambda kv: -kv[1])
    )

    cash_weight = 1.0 - sum(p.weight for p in positions)
    if cash_weight > 0.20:
        warnings.append(
            f"{cash_weight:.0%} en liquidités : la volatilité du panier ({unlevered_vol:.1%}) "
            f"dépasse la cible ({config.target_vol:.0%}), l'exposition est donc réduite. "
            "Relevez --vol-cible pour investir davantage, en acceptant plus de risque."
        )
    if exposure >= config.max_gross_exposure and unlevered_vol < config.target_vol:
        warnings.append(
            f"volatilité estimée ({unlevered_vol:.1%}) sous la cible ({config.target_vol:.0%}) : "
            "l'exposition reste plafonnée à 100 %, aucun levier n'est utilisé."
        )

    return TargetPortfolio(
        positions=positions,
        cash_weight=cash_weight,
        gross_exposure=exposure,
        unlevered_vol=unlevered_vol,
        expected_vol=unlevered_vol * exposure,
        diversification=diversification,
        warnings=tuple(warnings),
        config=config,
    )
