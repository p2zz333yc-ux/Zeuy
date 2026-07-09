import { useState, type ImgHTMLAttributes } from 'react'

type SafeImgProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  fallback: string
}

/**
 * Image avec repli local : si l'URL distante ne charge pas
 * (réseau coupé, CDN indisponible), on bascule sur l'asset embarqué.
 */
export default function SafeImg({ src, fallback, ...rest }: SafeImgProps) {
  const [failed, setFailed] = useState(false)
  return <img src={failed ? fallback : src} onError={() => setFailed(true)} {...rest} />
}
