(() => {
  "use strict";

  /* ============================== I18N ============================== */
  const I18N = {
    fr: {
      "brand.tagline": "Depuis 1960 · Genève",
      "nav.services": "Services", "nav.tools": "Outils en ligne", "nav.booking": "Rendez-vous",
      "nav.locations": "Nos sites", "nav.sustainability": "Engagement", "nav.faq": "FAQ",
      "nav.contact": "Contact", "nav.cta": "Prendre RDV",
      "hero.badge": "Le plus grand centre de pneus d'Europe",
      "hero.title1": "Vos pneus, montés et", "hero.title2": "gardés", "hero.title3": "sans effort",
      "hero.lead": "Depuis 1960 à Genève : montage, équilibrage, géométrie, gardiennage et dépannage pour tous véhicules. Réservez en ligne en 60 secondes, où que vous soyez.",
      "hero.cta1": "Réserver un créneau", "hero.cta2": "Trouver mes pneus",
      "hero.stat1": "Année de création", "hero.stat2": "Surface à Satigny",
      "hero.stat3": "Véhicules servis / jour", "hero.stat4": "Électricité auto-produite",
      "qa.book.t": "Prendre rendez-vous", "qa.book.d": "Choisissez site, date & heure",
      "qa.find.t": "Trouver mes pneus", "qa.find.d": "Par véhicule ou dimensions",
      "qa.quote.t": "Devis instantané", "qa.quote.d": "Estimation en temps réel",
      "qa.track.t": "Suivi gardiennage", "qa.track.d": "État de vos pneus stockés",
      "services.eyebrow": "Nos prestations", "services.title": "Un centre complet pour tous vos pneus",
      "services.lead": "Tourisme, 4x4, utilitaires, moto, poids lourds, agricole, génie civil et compétition — nous montons, équilibrons et stockons tout.",
      "services.s1.t": "Montage & équilibrage", "services.s1.d": "Montage rapide sur jantes, équilibrage de précision, valves TPMS incluses.",
      "services.s2.t": "Géométrie & parallélisme", "services.s2.d": "Réglage 3D pour une usure homogène et une tenue de route optimale.",
      "services.s3.t": "Gardiennage de pneus", "services.s3.d": "Stockage sécurisé de votre 2ème train, avec suivi en ligne de l'état des pneus.",
      "services.s4.t": "Dépannage", "services.s4.d": "Assistance rapide en cas de crevaison ou de pépin sur la route.",
      "services.s5.t": "Vente toutes catégories", "services.s5.d": "Été, hiver, 4 saisons, moto, poids lourd, agricole, compétition & rallye.",
      "services.s6.t": "Contrôle & sécurité", "services.s6.d": "Vérification pression, usure et âge des pneus à chaque passage, gratuitement.",
      "tools.eyebrow": "Outils en ligne", "tools.title": "Faites tout vous-même, en quelques clics",
      "tools.lead": "Contrairement à un simple site vitrine, notre plateforme vous laisse chercher, chiffrer et réserver sans décrocher le téléphone.",
      "tools.tab1": "🔍 Recherche pneus", "tools.tab2": "🧮 Devis instantané", "tools.tab3": "📦 Suivi gardiennage",
      "finder.vtype": "Type de véhicule", "finder.season": "Saison", "finder.width": "Largeur",
      "finder.height": "Série", "finder.diam": "Diamètre", "finder.btn": "Rechercher les pneus disponibles",
      "v.tourisme": "Tourisme", "v.4x4": "4x4 / SUV", "v.util": "Utilitaire", "v.moto": "Moto",
      "s.ete": "Été", "s.hiver": "Hiver", "s.4s": "4 saisons",
      "quote.vtype": "Type de véhicule", "quote.qty": "Nombre de pneus", "quote.services": "Services souhaités",
      "quote.estimate": "Estimation totale (hors pneus)", "quote.cta": "Réserver ce forfait",
      "quote.disclaimer": "Estimation indicative à titre informatif ; le prix définitif est confirmé sur place selon votre véhicule.",
      "qs.montage": "Montage + équilibrage", "qs.geo": "Géométrie", "qs.gard": "Gardiennage annuel", "qs.valves": "Valves TPMS neuves",
      "tracker.intro": "Entrez votre code client (démo : essayez <strong>DEMO-1</strong>, <strong>DEMO-2</strong> ou <strong>DEMO-3</strong>) pour voir l'état de vos pneus en gardiennage.",
      "tracker.code": "Code client", "tracker.btn": "Vérifier",
      "booking.eyebrow": "Réservation en ligne", "booking.title": "Prenez rendez-vous, pour n'importe quel service",
      "booking.lead": "À la différence du site actuel, réservé aux clients en gardiennage, notre prise de rendez-vous est ouverte à tous les services — montage, géométrie, dépannage ou gardiennage.",
      "booking.step1": "1. Site", "booking.step2": "2. Service", "booking.step3": "3. Créneau",
      "booking.step4": "4. Coordonnées", "booking.step5": "5. Confirmation",
      "booking.satignyDesc": "Sans rendez-vous ou sur RDV · 40'000 m²", "booking.vesenazDesc": "Sur rendez-vous uniquement",
      "booking.retrait": "Retrait gardiennage", "booking.name": "Nom complet", "booking.phone": "Téléphone",
      "booking.email": "E-mail", "booking.plate": "Immatriculation (optionnel)",
      "booking.ics": "📅 Ajouter à mon calendrier", "booking.new": "Nouvelle réservation",
      "booking.back": "← Retour", "booking.next": "Continuer →",
      "loc.eyebrow": "Nos sites à Genève", "loc.title": "Satigny & Vésenaz",
      "loc.lead": "Deux implantations pour couvrir toute l'agglomération genevoise, jusqu'à 1'000 véhicules traités par jour.",
      "loc.satignyDesc": "Site principal, 40'000 m². Accueil sans rendez-vous au rez-de-chaussée, clients sur RDV au 1er étage.",
      "loc.vesenazDesc": "Antenne de proximité rive gauche, sur rendez-vous uniquement, jusqu'à 200 véhicules/jour.",
      "loc.book": "Réserver ici",
      "sustain.eyebrow": "Engagement environnemental", "sustain.title": "Un géant du pneu, tourné vers demain",
      "sustain.i1t": "Électricité auto-produite depuis 2012", "sustain.i1d": "Panneaux solaires sur nos toitures pour une activité plus sobre en carbone.",
      "sustain.i2t": "Recyclage des pneus usagés", "sustain.i2d": "Filière de valorisation pour chaque pneu remplacé, aucun stockage sauvage.",
      "sustain.i3t": "Gardiennage = moins de trajets", "sustain.i3d": "Vos pneus restent chez nous d'une saison à l'autre : moins de stockage à domicile, moins de déplacements inutiles.",
      "testi.eyebrow": "Avis clients", "testi.title": "Ce que disent nos clients genevois",
      "testi.t1": "« Changement de pneus en 20 minutes chrono un samedi matin, sans avoir pris de rendez-vous. Impressionnant. »",
      "testi.t2": "« Le gardiennage me change la vie : je dépose mes pneus hiver, je récupère l'été, plus de stockage au garage. »",
      "testi.t3": "« Dépannage un dimanche soir sur l'autoroute, équipe réactive et professionnelle. »",
      "tips.eyebrow": "Conseils", "tips.title": "Bien préparer son changement de pneus",
      "tips.c1.date": "Saison", "tips.c1.t": "Quand passer aux pneus hiver ?",
      "tips.c1.d": "La règle des « 3×7 » : dès que la température descend sous 7°C régulièrement, entre le 7e et le dernier jour d'octobre.",
      "tips.c2.date": "Sécurité", "tips.c2.t": "Vérifier la pression, un réflexe",
      "tips.c2.d": "Un contrôle mensuel évite jusqu'à 20% de surconsommation de carburant et une usure prématurée.",
      "tips.c3.date": "Entretien", "tips.c3.t": "Pourquoi faire la géométrie ?",
      "tips.c3.d": "Après un choc de trottoir ou tous les 20'000 km, un réglage évite une usure irrégulière coûteuse.",
      "news.title": "Rappel de saison", "news.lead": "Recevez un rappel avant chaque changement de pneus (démo, aucune donnée envoyée).",
      "news.placeholder": "vous@exemple.ch", "news.cta": "M'inscrire",
      "faq.eyebrow": "Questions fréquentes", "faq.title": "Tout ce qu'il faut savoir",
      "faq.q1": "Faut-il un rendez-vous à Satigny ?",
      "faq.a1": "Non : Satigny accueille aussi les clients sans rendez-vous au rez-de-chaussée. Vésenaz fonctionne uniquement sur rendez-vous.",
      "faq.q2": "Le gardiennage est-il obligatoire pour réserver en ligne ?",
      "faq.a2": "Non, contrairement à l'ancien système. Notre nouvelle plateforme permet de réserver n'importe quel service en ligne, gardiennage ou non.",
      "faq.q3": "Quels types de véhicules acceptez-vous ?",
      "faq.a3": "Tourisme, 4x4, utilitaires légers et lourds, motos, poids lourds, agricole, génie civil, ainsi que pneus de compétition et rallye.",
      "faq.q4": "Comment fonctionne le suivi de gardiennage en ligne ?",
      "faq.a4": "Entrez votre code client dans l'outil « Suivi gardiennage » pour voir l'état de chaque pneu stocké et la date recommandée du prochain changement.",
      "faq.q5": "Proposez-vous un service de dépannage ?",
      "faq.a5": "Oui, en cas de crevaison ou de souci sur la route, contactez directement le site le plus proche par téléphone.",
      "contact.eyebrow": "Contact", "contact.title": "Une question ? Écrivez-nous",
      "contact.lead": "Notre équipe vous répond sous 24h ouvrées. Pour toute urgence, appelez directement votre site.",
      "contact.msg": "Message", "contact.send": "Envoyer le message",
      "contact.satigny": "Satigny", "contact.vesenaz": "Vésenaz",
      "footer.about": "Depuis 1960, le plus grand centre de montage et gardiennage de pneus d'Europe, au service de Genève.",
      "footer.nav": "Navigation", "footer.services": "Services", "footer.contact": "Contact",
      "footer.concept": "projet de refonte conceptuelle, non affilié", "footer.made": "Site conçu avec Claude",
      "js.open": "Satigny ouvert", "js.closed": "Satigny fermé",
      "js.stockOk": "En stock", "js.stockLow": "Stock limité",
      "js.perSet": "le train de 4", "js.addToBooking": "Réserver ce pneu",
      "js.day.mon": "Lun", "js.day.tue": "Mar", "js.day.wed": "Mer", "js.day.thu": "Jeu",
      "js.day.fri": "Ven", "js.day.sat": "Sam", "js.day.sun": "Dim",
      "js.closedDay": "Fermé", "js.noSlots": "Aucun créneau ce jour",
      "js.toast.news": "Merci ! Un rappel vous sera envoyé (démo).",
      "js.toast.contact": "Message envoyé (démo) — nous revenons vers vous sous 24h.",
      "js.toast.selectLoc": "Choisissez un site pour continuer.",
      "js.toast.selectSlot": "Choisissez un créneau pour continuer.",
      "js.toast.fillForm": "Merci de renseigner nom, téléphone et e-mail.",
      "js.toast.trackerNotFound": "Code inconnu. Essayez DEMO-1, DEMO-2 ou DEMO-3.",
      "js.confirm.loc": "Site", "js.confirm.service": "Service", "js.confirm.date": "Date",
      "js.confirm.time": "Heure", "js.confirm.name": "Client", "js.confirm.ref": "Référence",
      "js.confirm.title": "Rendez-vous confirmé !",
      "js.service.montage": "Montage + équilibrage", "js.service.geometrie": "Géométrie",
      "js.service.gardiennage": "Dépôt gardiennage", "js.service.retrait": "Retrait gardiennage",
      "js.service.depannage": "Dépannage",
      "js.tracker.set": "Jeu de pneus", "js.tracker.next": "Prochain changement conseillé",
      "js.tracker.location": "Site de gardiennage", "js.tracker.wear": "usure",
      "js.tracker.retrait": "Réserver le retrait"
    },
    en: {
      "brand.tagline": "Since 1960 · Geneva",
      "nav.services": "Services", "nav.tools": "Online tools", "nav.booking": "Book now",
      "nav.locations": "Our locations", "nav.sustainability": "Sustainability", "nav.faq": "FAQ",
      "nav.contact": "Contact", "nav.cta": "Book now",
      "hero.badge": "Europe's largest tire service center",
      "hero.title1": "Your tires, fitted and", "hero.title2": "stored", "hero.title3": "effortlessly",
      "hero.lead": "Since 1960 in Geneva: fitting, balancing, alignment, seasonal tire storage and roadside assistance for all vehicles. Book online in 60 seconds, wherever you are.",
      "hero.cta1": "Book a slot", "hero.cta2": "Find my tires",
      "hero.stat1": "Founded in", "hero.stat2": "Satigny site area",
      "hero.stat3": "Vehicles served / day", "hero.stat4": "Self-generated electricity",
      "qa.book.t": "Book an appointment", "qa.book.d": "Choose location, date & time",
      "qa.find.t": "Find my tires", "qa.find.d": "By vehicle or size",
      "qa.quote.t": "Instant quote", "qa.quote.d": "Real-time estimate",
      "qa.track.t": "Storage tracker", "qa.track.d": "Status of your stored tires",
      "services.eyebrow": "Our services", "services.title": "A full-service center for every tire",
      "services.lead": "Passenger cars, 4x4, vans, motorbikes, trucks, agricultural, civil engineering and competition — we fit, balance and store it all.",
      "services.s1.t": "Fitting & balancing", "services.s1.d": "Fast fitting on rims, precision balancing, TPMS valves included.",
      "services.s2.t": "Wheel alignment", "services.s2.d": "3D adjustment for even wear and optimal handling.",
      "services.s3.t": "Seasonal tire storage", "services.s3.d": "Secure storage of your second set, with online tracking of tire condition.",
      "services.s4.t": "Roadside assistance", "services.s4.d": "Fast help for a flat tire or breakdown on the road.",
      "services.s5.t": "Sales, all categories", "services.s5.d": "Summer, winter, all-season, motorbike, truck, agricultural, competition & rally.",
      "services.s6.t": "Safety checks", "services.s6.d": "Free pressure, wear and age check at every visit.",
      "tools.eyebrow": "Online tools", "tools.title": "Do it all yourself, in a few clicks",
      "tools.lead": "Unlike a plain showcase website, our platform lets you search, price and book without picking up the phone.",
      "tools.tab1": "🔍 Tire finder", "tools.tab2": "🧮 Instant quote", "tools.tab3": "📦 Storage tracker",
      "finder.vtype": "Vehicle type", "finder.season": "Season", "finder.width": "Width",
      "finder.height": "Aspect ratio", "finder.diam": "Diameter", "finder.btn": "Search available tires",
      "v.tourisme": "Passenger car", "v.4x4": "4x4 / SUV", "v.util": "Van", "v.moto": "Motorbike",
      "s.ete": "Summer", "s.hiver": "Winter", "s.4s": "All-season",
      "quote.vtype": "Vehicle type", "quote.qty": "Number of tires", "quote.services": "Services wanted",
      "quote.estimate": "Total estimate (tires excluded)", "quote.cta": "Book this package",
      "quote.disclaimer": "Indicative estimate only; final price confirmed on-site based on your vehicle.",
      "qs.montage": "Fitting + balancing", "qs.geo": "Wheel alignment", "qs.gard": "Yearly storage", "qs.valves": "New TPMS valves",
      "tracker.intro": "Enter your customer code (demo: try <strong>DEMO-1</strong>, <strong>DEMO-2</strong> or <strong>DEMO-3</strong>) to see the status of your stored tires.",
      "tracker.code": "Customer code", "tracker.btn": "Check",
      "booking.eyebrow": "Online booking", "booking.title": "Book an appointment, for any service",
      "booking.lead": "Unlike the current site — booking limited to storage customers — our system is open for every service: fitting, alignment, roadside help or storage.",
      "booking.step1": "1. Location", "booking.step2": "2. Service", "booking.step3": "3. Time slot",
      "booking.step4": "4. Your details", "booking.step5": "5. Confirmation",
      "booking.satignyDesc": "Walk-in or by appointment · 40,000 m²", "booking.vesenazDesc": "By appointment only",
      "booking.retrait": "Storage pickup", "booking.name": "Full name", "booking.phone": "Phone",
      "booking.email": "Email", "booking.plate": "License plate (optional)",
      "booking.ics": "📅 Add to my calendar", "booking.new": "New booking",
      "booking.back": "← Back", "booking.next": "Continue →",
      "loc.eyebrow": "Our Geneva locations", "loc.title": "Satigny & Vésenaz",
      "loc.lead": "Two sites covering the whole Geneva area, up to 1,000 vehicles serviced per day.",
      "loc.satignyDesc": "Main site, 40,000 m². Walk-in welcome on the ground floor, appointments on the 1st floor.",
      "loc.vesenazDesc": "Left-bank branch, by appointment only, up to 200 vehicles/day.",
      "loc.book": "Book here",
      "sustain.eyebrow": "Environmental commitment", "sustain.title": "A tire giant, built for tomorrow",
      "sustain.i1t": "Self-generated electricity since 2012", "sustain.i1d": "Solar panels on our roofs for a lower-carbon operation.",
      "sustain.i2t": "Used tire recycling", "sustain.i2d": "A recovery channel for every tire replaced, no wild storage.",
      "sustain.i3t": "Storage means fewer trips", "sustain.i3d": "Your tires stay with us between seasons: less storage at home, fewer unnecessary trips.",
      "testi.eyebrow": "Customer reviews", "testi.title": "What our Geneva customers say",
      "testi.t1": "\"Tire change in 20 minutes flat on a Saturday morning, no appointment needed. Impressive.\"",
      "testi.t2": "\"Storage changed my life: I drop off winter tires, pick them up in summer, no more storage at home.\"",
      "testi.t3": "\"Roadside help on a Sunday evening on the highway, responsive and professional team.\"",
      "tips.eyebrow": "Tips", "tips.title": "Get ready for your tire change",
      "tips.c1.date": "Season", "tips.c1.t": "When to switch to winter tires?",
      "tips.c1.d": "The \"7/7 rule\": once temperatures regularly drop below 7°C, between early and late October.",
      "tips.c2.date": "Safety", "tips.c2.t": "Check pressure, make it a habit",
      "tips.c2.d": "A monthly check avoids up to 20% extra fuel use and premature wear.",
      "tips.c3.date": "Maintenance", "tips.c3.t": "Why get an alignment?",
      "tips.c3.d": "After hitting a curb or every 20,000 km, an adjustment avoids costly uneven wear.",
      "news.title": "Seasonal reminder", "news.lead": "Get a reminder before every tire change (demo, no data sent).",
      "news.placeholder": "you@example.com", "news.cta": "Subscribe",
      "faq.eyebrow": "Frequently asked questions", "faq.title": "Everything you need to know",
      "faq.q1": "Do I need an appointment at Satigny?",
      "faq.a1": "No: Satigny also welcomes walk-in customers on the ground floor. Vésenaz operates by appointment only.",
      "faq.q2": "Is storage required to book online?",
      "faq.a2": "No, unlike the previous system. Our new platform lets you book any service online, storage or not.",
      "faq.q3": "What vehicle types do you accept?",
      "faq.a3": "Passenger cars, 4x4, light and heavy vans, motorbikes, trucks, agricultural, civil engineering, plus competition and rally tires.",
      "faq.q4": "How does the online storage tracker work?",
      "faq.a4": "Enter your customer code in the \"Storage tracker\" tool to see the condition of each stored tire and the recommended next change date.",
      "faq.q5": "Do you offer roadside assistance?",
      "faq.a5": "Yes, in case of a flat tire or issue on the road, call the nearest site directly.",
      "contact.eyebrow": "Contact", "contact.title": "A question? Write to us",
      "contact.lead": "Our team replies within 24 business hours. For emergencies, call your site directly.",
      "contact.msg": "Message", "contact.send": "Send message",
      "contact.satigny": "Satigny", "contact.vesenaz": "Vésenaz",
      "footer.about": "Since 1960, Europe's largest tire fitting and storage center, serving Geneva.",
      "footer.nav": "Navigation", "footer.services": "Services", "footer.contact": "Contact",
      "footer.concept": "conceptual redesign project, not affiliated", "footer.made": "Site designed with Claude",
      "js.open": "Satigny open", "js.closed": "Satigny closed",
      "js.stockOk": "In stock", "js.stockLow": "Low stock",
      "js.perSet": "set of 4", "js.addToBooking": "Book this tire",
      "js.day.mon": "Mon", "js.day.tue": "Tue", "js.day.wed": "Wed", "js.day.thu": "Thu",
      "js.day.fri": "Fri", "js.day.sat": "Sat", "js.day.sun": "Sun",
      "js.closedDay": "Closed", "js.noSlots": "No slots this day",
      "js.toast.news": "Thanks! A reminder will be sent to you (demo).",
      "js.toast.contact": "Message sent (demo) — we'll get back to you within 24h.",
      "js.toast.selectLoc": "Choose a location to continue.",
      "js.toast.selectSlot": "Choose a time slot to continue.",
      "js.toast.fillForm": "Please fill in name, phone and email.",
      "js.toast.trackerNotFound": "Unknown code. Try DEMO-1, DEMO-2 or DEMO-3.",
      "js.confirm.loc": "Location", "js.confirm.service": "Service", "js.confirm.date": "Date",
      "js.confirm.time": "Time", "js.confirm.name": "Customer", "js.confirm.ref": "Reference",
      "js.confirm.title": "Appointment confirmed!",
      "js.service.montage": "Fitting + balancing", "js.service.geometrie": "Wheel alignment",
      "js.service.gardiennage": "Storage drop-off", "js.service.retrait": "Storage pickup",
      "js.service.depannage": "Roadside assistance",
      "js.tracker.set": "Tire set", "js.tracker.next": "Recommended next change",
      "js.tracker.location": "Storage site", "js.tracker.wear": "wear",
      "js.tracker.retrait": "Book the pickup"
    }
  };

  let LANG = localStorage.getItem("pc_lang") || "fr";
  const t = (key) => (I18N[LANG] && I18N[LANG][key]) || (I18N.fr[key] || key);

  function applyI18n() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.innerHTML = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.getElementById("langToggle").textContent = LANG === "fr" ? "FR" : "EN";
    renderHours();
    updateStatusPill();
    renderDayTabs();
    renderTrackerPlaceholderText();
  }

  document.getElementById("langToggle").addEventListener("click", () => {
    LANG = LANG === "fr" ? "en" : "fr";
    localStorage.setItem("pc_lang", LANG);
    applyI18n();
  });

  /* ============================== THEME ============================== */
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("pc_theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  document.getElementById("themeToggle").addEventListener("click", () => {
    const current = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("pc_theme", next);
  });

  /* ============================== TOAST ============================== */
  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  /* ============================== HEADER / NAV ============================== */
  const header = document.getElementById("siteHeader");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  });

  const drawer = document.getElementById("mobileDrawer");
  document.getElementById("navToggle").addEventListener("click", () => drawer.classList.add("open"));
  document.getElementById("drawerClose").addEventListener("click", () => drawer.classList.remove("open"));
  document.getElementById("drawerBackdrop").addEventListener("click", () => drawer.classList.remove("open"));
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => drawer.classList.remove("open")));

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", () => scrollToId(el.getAttribute("data-scroll")));
  });
  document.querySelectorAll("[data-tab-target]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = el.getAttribute("data-tab-target");
      document.querySelector(`.tool-tab[data-tab="${target}"]`)?.click();
      scrollToId("outils");
    });
  });

  /* ============================== OPEN/CLOSED STATUS ============================== */
  function zurichNow() {
    const s = new Date().toLocaleString("en-US", { timeZone: "Europe/Zurich" });
    return new Date(s);
  }
  function isOpenNow() {
    const now = zurichNow();
    const day = now.getDay(); // 0 sun .. 6 sat
    const hour = now.getHours() + now.getMinutes() / 60;
    if (day === 0) return false;
    if (day === 6) return hour >= 7 && hour < 12;
    return hour >= 7 && hour < 18;
  }
  function updateStatusPill() {
    const pill = document.getElementById("statusPill");
    const open = isOpenNow();
    pill.classList.toggle("open", open);
    pill.classList.toggle("closed", !open);
    document.getElementById("statusPillText").textContent = open ? t("js.open") : t("js.closed");
  }

  function renderHours() {
    const days = [
      ["Mon-Fri", "js.day.mon"], // placeholder replaced below with real rows
    ];
    const rowsFr = LANG === "fr"
      ? [["Lundi – Vendredi", "7h – 18h"], ["Samedi (avr–juin, mi-oct–déc)", "7h – 12h"], ["Dimanche", "Fermé"]]
      : [["Monday – Friday", "7am – 6pm"], ["Saturday (Apr–Jun, mid-Oct–Dec)", "7am – 12pm"], ["Sunday", "Closed"]];
    const now = zurichNow();
    const day = now.getDay();
    const buildTable = (targetId) => {
      const table = document.getElementById(targetId);
      if (!table) return;
      table.innerHTML = "";
      rowsFr.forEach((row, i) => {
        const isToday = (i === 0 && day >= 1 && day <= 5) || (i === 1 && day === 6) || (i === 2 && day === 0);
        const tr = document.createElement("tr");
        if (isToday) tr.className = "today";
        tr.innerHTML = `<td>${row[0]}</td><td>${row[1]}</td>`;
        table.appendChild(tr);
      });
    };
    buildTable("hoursSatigny");
    buildTable("hoursVesenaz");
  }

  /* ============================== TOOL TABS ============================== */
  const toolTabs = document.querySelectorAll(".tool-tab");
  toolTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      toolTabs.forEach((tb) => { tb.classList.remove("active"); tb.setAttribute("aria-selected", "false"); });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      document.querySelectorAll(".tool-panel").forEach((p) => p.classList.remove("active"));
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
    });
  });

  /* ============================== CHECK PILL STYLING ============================== */
  document.querySelectorAll(".check-pill input").forEach((input) => {
    const sync = () => input.closest(".check-pill").classList.toggle("checked", input.checked);
    input.addEventListener("change", sync);
    sync();
  });

  /* ============================== TIRE FINDER ============================== */
  const WIDTHS = [175, 185, 195, 205, 215, 225, 235, 245, 255, 265];
  const RATIOS = [35, 40, 45, 50, 55, 60, 65, 70];
  const DIAMS = [15, 16, 17, 18, 19, 20];
  const fWidth = document.getElementById("fWidth");
  const fHeight = document.getElementById("fHeight");
  const fDiam = document.getElementById("fDiam");
  WIDTHS.forEach((w) => fWidth.appendChild(new Option(w, w)));
  RATIOS.forEach((r) => fHeight.appendChild(new Option(r, r)));
  DIAMS.forEach((d) => fDiam.appendChild(new Option(`R${d}`, d)));
  fWidth.value = 205; fHeight.value = 55; fDiam.value = 16;

  const BRANDS = [
    { name: "Michelin", mult: 1.18, models: { ete: "Primacy 4+", hiver: "Alpin 6", "4saisons": "CrossClimate 2" } },
    { name: "Continental", mult: 1.08, models: { ete: "PremiumContact 7", hiver: "WinterContact TS 870", "4saisons": "AllSeasonContact 2" } },
    { name: "Pirelli", mult: 1.1, models: { ete: "Cinturato P7", hiver: "Sottozero 3", "4saisons": "Cinturato All Season SF3" } },
    { name: "Goodyear", mult: 1.0, models: { ete: "EfficientGrip Perf 2", hiver: "UltraGrip 9+", "4saisons": "Vector 4Seasons Gen3" } },
    { name: "Bridgestone", mult: 1.05, models: { ete: "Turanza 6", hiver: "Blizzak 6", "4saisons": "Weather Control A005" } },
    { name: "Hankook", mult: 0.85, models: { ete: "Ventus Prime 4", hiver: "Winter i*cept RS3", "4saisons": "Kinergy 4S2" } }
  ];
  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  const VEHICLE_MULT = { tourisme: 1, "4x4": 1.35, utilitaire: 1.25, moto: 0.55 };
  const SEASON_MULT = { ete: 1, hiver: 1.1, "4saisons": 1.15 };

  document.getElementById("findBtn").addEventListener("click", () => {
    const vehicle = document.getElementById("fVehicle").value;
    const season = document.getElementById("fSeason").value;
    const width = +fWidth.value, ratio = +fHeight.value, diam = +fDiam.value;
    const base = 85 + (diam - 15) * 16 + (width - 175) / 10 * 5 + (70 - ratio) * 0.6;
    const results = BRANDS.map((b, i) => {
      const price = Math.round((base * VEHICLE_MULT[vehicle] * SEASON_MULT[season] * b.mult) / 5) * 5;
      const stockLow = hashCode(`${width}${ratio}${diam}${i}${vehicle}`) % 3 === 0;
      return { brand: b.name, model: b.models[season], price, stockLow };
    }).sort((a, b) => a.price - b.price).slice(0, 5);

    const box = document.getElementById("finderResults");
    box.innerHTML = results.map((r) => `
      <div class="tire-result">
        <div class="tinfo">
          <strong>${r.brand} ${r.model}</strong>
          <span>${width}/${ratio} R${diam} — <span class="tag ${r.stockLow ? "stock-low" : "stock-ok"}">${r.stockLow ? t("js.stockLow") : t("js.stockOk")}</span></span>
        </div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="text-align:right">
            <div class="price">CHF ${r.price}.–</div>
            <div style="font-size:.72rem;color:var(--text-muted)">/ pneu · ${t("js.perSet")}: CHF ${r.price * 4}.–</div>
          </div>
          <button class="btn btn-primary btn-sm add-to-booking">${t("js.addToBooking")}</button>
        </div>
      </div>`).join("");
    box.querySelectorAll(".add-to-booking").forEach((btn) => {
      btn.addEventListener("click", () => {
        scrollToId("rdv");
        document.querySelector('input[name="wservice"][value="montage"]').checked = true;
        document.querySelectorAll(".check-pill").forEach((p) => p.classList.toggle("checked", p.querySelector("input")?.checked));
      });
    });
  });
  document.getElementById("findBtn").click();

  /* ============================== QUOTE CALCULATOR ============================== */
  const QUOTE_PRICES = { montage: 25, geometrie: 90, gardiennage: 120, valves: 8 };
  function computeQuote() {
    const vehicle = document.getElementById("qVehicle").value;
    const qty = +document.getElementById("qQty").value;
    const mult = VEHICLE_MULT[vehicle];
    let total = 0;
    document.querySelectorAll("#quoteChecks input:checked").forEach((c) => {
      if (c.value === "montage") total += QUOTE_PRICES.montage * qty * mult;
      else if (c.value === "valves") total += QUOTE_PRICES.valves * qty;
      else if (c.value === "geometrie") total += QUOTE_PRICES.geometrie * mult;
      else if (c.value === "gardiennage") total += QUOTE_PRICES.gardiennage;
    });
    document.getElementById("quoteTotal").textContent = `CHF ${Math.round(total)}.–`;
  }
  document.querySelectorAll("#qVehicle, #qQty").forEach((el) => el.addEventListener("change", computeQuote));
  document.querySelectorAll("#quoteChecks input").forEach((el) => el.addEventListener("change", computeQuote));
  computeQuote();

  /* ============================== STORAGE TRACKER ============================== */
  const TRACKER_DB = {
    "DEMO-1": {
      client: "Fam. Dupont", set: "4 pneus hiver 205/55 R16", location: "Satigny",
      wheels: [["AV-G", 30], ["AV-D", 32], ["AR-G", 28], ["AR-D", 29]], next: "15.10.2026"
    },
    "DEMO-2": {
      client: "M. Rossi", set: "4 pneus été 225/45 R17", location: "Vésenaz",
      wheels: [["AV-G", 40], ["AV-D", 65], ["AR-G", 38], ["AR-D", 42]], next: "01.06.2027"
    },
    "DEMO-3": {
      client: "Sté Genève Transport", set: "6 pneus utilitaire 195/70 R15C", location: "Satigny",
      wheels: [["1", 45], ["2", 48], ["3", 70], ["4", 50], ["5", 33], ["6", 36]], next: "20.11.2026"
    }
  };
  document.getElementById("trackerBtn").addEventListener("click", () => {
    const code = document.getElementById("trackerCode").value.trim().toUpperCase();
    const box = document.getElementById("trackerResult");
    const rec = TRACKER_DB[code];
    if (!rec) {
      box.innerHTML = `<p style="color:var(--danger);font-weight:600">${t("js.toast.trackerNotFound")}</p>`;
      return;
    }
    box.innerHTML = `
      <div class="card tracker-card">
        <div>
          <h3 style="margin-bottom:4px">${rec.client}</h3>
          <p style="margin-bottom:6px">${t("js.tracker.set")}: <strong>${rec.set}</strong></p>
          <p style="margin-bottom:6px">${t("js.tracker.location")}: <strong>${rec.location}</strong></p>
          <p style="margin-bottom:16px">${t("js.tracker.next")}: <strong>${rec.next}</strong></p>
          <button class="btn btn-primary btn-sm" id="trackerBookBtn">${t("js.tracker.retrait")}</button>
        </div>
        <div class="tire-set-visual">
          ${rec.wheels.map(([pos, wear]) => `
            <div class="wheel-chip ${wear >= 60 ? "warn" : "good"}">
              <span>${pos}</span><b>${wear}%</b><span style="font-size:.65rem">${t("js.tracker.wear")}</span>
            </div>`).join("")}
        </div>
      </div>`;
    document.getElementById("trackerBookBtn").addEventListener("click", () => {
      scrollToId("rdv");
      const r = document.querySelector('input[name="wservice"][value="retrait"]');
      if (r) { r.checked = true; document.querySelectorAll("#wServices .check-pill").forEach((p) => p.classList.toggle("checked", p.querySelector("input").checked)); }
    });
  });
  function renderTrackerPlaceholderText() {
    const input = document.getElementById("trackerCode");
    if (input) input.placeholder = "DEMO-1";
  }

  /* ============================== BOOKING WIZARD ============================== */
  let currentStep = 1;
  let selectedLoc = null;
  let selectedDay = null;
  let selectedSlot = null;

  const locCards = document.querySelectorAll(".loc-card");
  locCards.forEach((card) => {
    card.addEventListener("click", () => selectLoc(card.dataset.loc));
  });
  function selectLoc(loc) {
    selectedLoc = loc;
    locCards.forEach((c) => c.classList.toggle("selected", c.dataset.loc === loc));
  }
  document.querySelectorAll("[data-preselect-loc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectLoc(btn.getAttribute("data-preselect-loc"));
      goToStep(1);
      scrollToId("rdv");
    });
  });

  function stepPills() { return document.querySelectorAll(".step-pill"); }
  function goToStep(n) {
    currentStep = n;
    document.querySelectorAll(".wizard-step").forEach((s) => s.classList.toggle("active", +s.dataset.step === n));
    stepPills().forEach((p) => {
      const ps = +p.dataset.step;
      p.classList.toggle("active", ps === n);
      p.classList.toggle("done", ps < n);
    });
    const nextBtn = document.getElementById("wizardNext");
    const backBtn = document.getElementById("wizardBack");
    backBtn.style.visibility = n === 1 ? "hidden" : "visible";
    nextBtn.style.display = n === 5 ? "none" : "inline-flex";
    if (n === 3) renderDayTabs();
  }

  document.getElementById("wizardNext").addEventListener("click", () => {
    if (currentStep === 1 && !selectedLoc) { showToast(t("js.toast.selectLoc")); return; }
    if (currentStep === 3 && !selectedSlot) { showToast(t("js.toast.selectSlot")); return; }
    if (currentStep === 4) {
      const name = document.getElementById("wName").value.trim();
      const phone = document.getElementById("wPhone").value.trim();
      const email = document.getElementById("wEmail").value.trim();
      if (!name || !phone || !email) { showToast(t("js.toast.fillForm")); return; }
      buildConfirmation();
    }
    if (currentStep < 5) goToStep(currentStep + 1);
  });
  document.getElementById("wizardBack").addEventListener("click", () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });
  document.getElementById("newBooking").addEventListener("click", () => {
    selectedLoc = null; selectedDay = null; selectedSlot = null;
    locCards.forEach((c) => c.classList.remove("selected"));
    document.getElementById("wName").value = "";
    document.getElementById("wPhone").value = "";
    document.getElementById("wEmail").value = "";
    document.getElementById("wPlate").value = "";
    goToStep(1);
  });

  function renderDayTabs() {
    const wrap = document.getElementById("dayTabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    const dayKeys = ["js.day.sun", "js.day.mon", "js.day.tue", "js.day.wed", "js.day.thu", "js.day.fri", "js.day.sat"];
    const today = zurichNow();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const isSun = d.getDay() === 0;
      const tab = document.createElement("button");
      tab.className = "day-tab" + (selectedDay === key ? " selected" : "");
      tab.innerHTML = `<small>${t(dayKeys[d.getDay()])}</small><b>${d.getDate()}</b>`;
      if (isSun) tab.style.opacity = ".4";
      tab.addEventListener("click", () => {
        selectedDay = key;
        selectedSlot = null;
        renderDayTabs();
        renderSlots(d);
      });
      wrap.appendChild(tab);
      if (!selectedDay && !isSun) { selectedDay = key; }
    }
    const selectedDate = new Date(selectedDay);
    renderSlots(selectedDate);
  }

  function renderSlots(date) {
    const grid = document.getElementById("slotGrid");
    if (!grid) return;
    const day = date.getDay();
    grid.innerHTML = "";
    if (day === 0) { grid.innerHTML = `<p>${t("js.closedDay")}</p>`; return; }
    const startH = 7, endH = day === 6 ? 12 : 18;
    const dateKey = date.toISOString().slice(0, 10);
    let any = false;
    for (let h = startH; h < endH; h++) {
      for (const m of [0, 30]) {
        if (h === endH - 1 && m === 30 && endH === 12) continue;
        const label = `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
        const busy = hashCode(`${dateKey}${label}${selectedLoc || ""}`) % 4 === 0;
        const btn = document.createElement("button");
        btn.className = "slot-btn" + (selectedSlot === label && !busy ? " selected" : "");
        btn.textContent = label;
        btn.disabled = busy;
        if (!busy) {
          any = true;
          btn.addEventListener("click", () => {
            selectedSlot = label;
            grid.querySelectorAll(".slot-btn").forEach((b) => b.classList.remove("selected"));
            btn.classList.add("selected");
          });
        }
        grid.appendChild(btn);
      }
    }
    if (!any) grid.innerHTML = `<p>${t("js.noSlots")}</p>`;
  }

  function buildConfirmation() {
    const service = document.querySelector('input[name="wservice"]:checked')?.value || "montage";
    const name = document.getElementById("wName").value.trim();
    const ref = "PC-" + Math.abs(hashCode(name + selectedDay + selectedSlot + Date.now())).toString(36).toUpperCase().slice(0, 6);
    const locLabel = selectedLoc === "vesenaz" ? "Vésenaz" : "Satigny";
    const dateLabel = new Date(selectedDay).toLocaleDateString(LANG === "fr" ? "fr-CH" : "en-GB", { weekday: "long", day: "numeric", month: "long" });
    document.getElementById("confirmCard").innerHTML = `
      <h3 style="margin-bottom:16px">✅ ${t("js.confirm.title")}</h3>
      <div class="confirm-row"><span>${t("js.confirm.loc")}</span><strong>${locLabel}</strong></div>
      <div class="confirm-row"><span>${t("js.confirm.service")}</span><strong>${t("js.service." + service)}</strong></div>
      <div class="confirm-row"><span>${t("js.confirm.date")}</span><strong>${dateLabel}</strong></div>
      <div class="confirm-row"><span>${t("js.confirm.time")}</span><strong>${selectedSlot}</strong></div>
      <div class="confirm-row"><span>${t("js.confirm.name")}</span><strong>${name}</strong></div>
      <div class="confirm-row"><span>${t("js.confirm.ref")}</span><strong>${ref}</strong></div>
    `;
    window.__pcBooking = { service, name, locLabel, dateLabel, ref, day: selectedDay, slot: selectedSlot };
  }

  document.getElementById("downloadIcs").addEventListener("click", () => {
    const b = window.__pcBooking;
    if (!b) return;
    const [h, m] = b.slot.split(":").map(Number);
    const start = new Date(b.day);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + 30 * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pneus Claude//RDV//FR", "BEGIN:VEVENT",
      `UID:${b.ref}@pneusclaude.demo`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:Pneus Claude — ${b.locLabel} (${b.ref})`,
      `DESCRIPTION:Rendez-vous ${t("js.service." + b.service)} — ${b.name}`,
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rdv-pneus-claude-${b.ref}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ============================== TESTIMONIALS ============================== */
  const slides = document.querySelectorAll(".testi-slide");
  const dots = document.querySelectorAll(".testi-dot");
  let testiIdx = 0;
  function showTesti(i) {
    testiIdx = i;
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
  }
  dots.forEach((d) => d.addEventListener("click", () => showTesti(+d.dataset.idx)));
  setInterval(() => showTesti((testiIdx + 1) % slides.length), 6000);

  /* ============================== NEWSLETTER / CONTACT ============================== */
  document.getElementById("newsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    showToast(t("js.toast.news"));
    e.target.reset();
  });
  document.getElementById("contactSend").addEventListener("click", () => {
    showToast(t("js.toast.contact"));
    document.getElementById("cName").value = "";
    document.getElementById("cEmail").value = "";
    document.getElementById("cMsg").value = "";
  });

  /* ============================== MISC ============================== */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ============================== INIT ============================== */
  applyI18n();
  goToStep(1);
})();
