import type { CuratedRoute } from "../types.js";

/**
 * Kyoto field test: Nijō Castle → Gion → Kiyomizu-dera.
 *
 * Coordinates are approximate (±50 m) and were not checked against a live source.
 * The server should refine them from Wikipedia/OSM at runtime, and they must be checked
 * before the trip.
 */
export const kyotoHigashiyama: CuratedRoute = {
  id: "kyoto-higashiyama",
  title: "Kyoto: Castle to Kiyomizu",
  city: "Kyoto",
  timeZone: "Asia/Tokyo",
  stops: [
    {
      id: "nijo-castle",
      name: "Nijō Castle",
      nativeName: "二条城",
      pronunciation: "NEE-joh",
      location: { lat: 35.0142, lng: 135.7481 },
      triggerRadiusM: 120,
      wikipedia: { en: "Nijō Castle", ja: "二条城" },
      talkingPoints: [
        "Built by Tokugawa Ieyasu in 1603 as the shogun's Kyoto residence: a display of military power next to the emperor's court",
        "Nightingale floors (uguisubari) in Ninomaru Palace squeak to expose intruders",
        "In 1867 the last shogun announced the return of power to the emperor here, ending 260 years of Tokugawa rule",
      ],
      headsUp: ["No photos inside Ninomaru Palace; shoes off"],
    },
    {
      id: "nishiki-market",
      name: "Nishiki Market",
      nativeName: "錦市場",
      pronunciation: "nee-SHEE-kee",
      location: { lat: 35.005, lng: 135.7649 },
      triggerRadiusM: 80,
      wikipedia: { en: "Nishiki Market", ja: "錦市場" },
      talkingPoints: [
        "\"Kyoto's kitchen\": a food market on this street for roughly 400 years",
        "Kyoto pickles (tsukemono), yuba, dashimaki tamago, and knife makers",
      ],
      headsUp: ["Many stalls ask that you don't eat while walking; eat at the stall"],
    },
    {
      id: "pontocho",
      name: "Pontochō",
      nativeName: "先斗町",
      pronunciation: "PON-toh-choh",
      location: { lat: 35.006, lng: 135.7712 },
      triggerRadiusM: 80,
      wikipedia: { en: "Pontochō", ja: "先斗町" },
      talkingPoints: [
        "One of Kyoto's five hanamachi (geisha districts), squeezed between Kiyamachi and the Kamo River",
        "Kawayuka: summer dining platforms built out over the river",
        "Plover (chidori) crest on the lanterns",
      ],
      headsUp: ["Private teahouses: don't photograph geiko or maiko without consent"],
    },
    {
      id: "minamiza",
      name: "Shijō Ōhashi & Minami-za",
      nativeName: "南座",
      pronunciation: "mee-NAH-mee-zah",
      location: { lat: 35.0037, lng: 135.7731 },
      triggerRadiusM: 80,
      wikipedia: { en: "Minami-za", ja: "南座" },
      talkingPoints: [
        "Izumo no Okuni is said to have started kabuki on the dry Kamo riverbed around 1603",
        "Minami-za is regarded as Japan's oldest kabuki theatre site",
        "Kaomise ('face-showing') performances in December with name boards (maneki) on the facade",
      ],
    },
    {
      id: "gion-shirakawa",
      name: "Gion: Shirakawa & Hanamikōji",
      nativeName: "祇園",
      pronunciation: "GHEE-on",
      location: { lat: 35.0045, lng: 135.775 },
      triggerRadiusM: 150,
      wikipedia: { en: "Gion", ja: "祇園" },
      talkingPoints: [
        "Geiko (Kyoto's word for geisha) and maiko apprentices, and the ochaya teahouse system",
        "Tatsumi Bridge and the willow-lined Shirakawa canal",
        "Ichiriki Chaya at the corner of Hanamikōji and its link to the 47 Rōnin story",
      ],
      headsUp: [
        "Photography is banned on some private lanes off Hanamikōji; fines may apply",
        "Never block, follow, or touch maiko",
      ],
    },
    {
      id: "yasaka-shrine",
      name: "Yasaka Shrine & Maruyama Park",
      nativeName: "八坂神社",
      pronunciation: "yah-SAH-kah",
      location: { lat: 35.0036, lng: 135.7785 },
      triggerRadiusM: 120,
      wikipedia: { en: "Yasaka Shrine", ja: "八坂神社" },
      talkingPoints: [
        "Home shrine of the Gion Matsuri, held every July for over 1,000 years",
        "The vermilion west gate facing Shijō-dōri",
        "Maruyama Park's giant weeping cherry (shidarezakura)",
      ],
    },
    {
      id: "kodaiji",
      name: "Nene-no-michi & Kōdai-ji",
      nativeName: "高台寺",
      pronunciation: "KOH-dye-jee",
      location: { lat: 35.0006, lng: 135.781 },
      triggerRadiusM: 120,
      wikipedia: { en: "Kōdai-ji", ja: "高台寺" },
      talkingPoints: [
        "Founded by Nene (Kita no Mandokoro) in memory of her husband Toyotomi Hideyoshi, who unified Japan",
        "Nene-no-michi: the stone-paved lane named for her",
        "Seasonal night illuminations",
      ],
    },
    {
      id: "sannenzaka",
      name: "Yasaka Pagoda, Ninenzaka & Sannenzaka",
      nativeName: "三年坂",
      pronunciation: "SAHN-nen-zah-kah",
      location: { lat: 34.9975, lng: 135.781 },
      triggerRadiusM: 150,
      wikipedia: { en: "Sannenzaka", ja: "産寧坂" },
      talkingPoints: [
        "Hōkan-ji's five-storey Yasaka Pagoda, an icon of the skyline",
        "Preserved machiya townhouse streetscape",
        "Legend: trip on Sannenzaka and you'll have three years of bad luck (gourd charms sold to ward it off)",
      ],
      headsUp: ["Very crowded; regroup at the top of Sannenzaka"],
    },
    {
      id: "kiyomizu-dera",
      name: "Kiyomizu-dera",
      nativeName: "清水寺",
      pronunciation: "kee-YOH-mee-zoo DEH-rah",
      location: { lat: 34.9949, lng: 135.785 },
      triggerRadiusM: 200,
      wikipedia: { en: "Kiyomizu-dera", ja: "清水寺" },
      talkingPoints: [
        "Founded in 778. The present main hall dates from 1633",
        "The wooden stage, about 13 m high, is built without nails",
        "'To jump off the stage at Kiyomizu' is an idiom for taking a bold leap",
        "Otowa Waterfall: three streams said to grant longevity, success, or love; drink from only one",
      ],
    },
  ],
  legs: [
    { from: "nijo-castle", to: "nishiki-market", mode: "walk", note: "~2 km east; or Tōzai line Nijōjō-mae → Kyoto Shiyakusho-mae" },
    { from: "nishiki-market", to: "pontocho", mode: "walk" },
    { from: "pontocho", to: "minamiza", mode: "walk", note: "Cross the Kamo River on Shijō Ōhashi" },
    { from: "minamiza", to: "gion-shirakawa", mode: "walk" },
    { from: "gion-shirakawa", to: "yasaka-shrine", mode: "walk" },
    { from: "yasaka-shrine", to: "kodaiji", mode: "walk", note: "Through Maruyama Park, then Nene-no-michi" },
    { from: "kodaiji", to: "sannenzaka", mode: "walk", note: "Via Ishibe-kōji alley" },
    { from: "sannenzaka", to: "kiyomizu-dera", mode: "walk", note: "Uphill; time it for sunset" },
  ],
};
