# Donate drink by locale

The donate button ("Buy me a coffee") names a drink that fits each locale's culture.
Text lives in `<locale>.po` (`options:footBar:button` and `popup` contexts).

Alcohol is allowed, except where local law or the majority religion would object.

| Locale | Alcohol-free          | Alcohol             | Restriction                                                                    | Chosen    |
| ------ | --------------------- | ------------------- | ------------------------------------------------------------------------------ | --------- |
| en     | Coffee, tea           | Beer                | —                                                                              | Coffee    |
| de     | Kaffee, Apfelschorle  | Bier                | —                                                                              | Bier      |
| es     | Café, horchata        | Caña, sangría       | —                                                                              | Caña      |
| fr     | Café                  | Vin                 | Loi Évin limits alcohol advertising; a button label was judged acceptable      | Vin       |
| it     | Caffè                 | Vino, Aperol spritz | —                                                                              | Caffè     |
| pt_BR  | Cafezinho, guaraná    | Caipirinha          | —                                                                              | Cafezinho |
| pt_PT  | Bica, galão           | Vinho, ginjinha     | —                                                                              | Bica      |
| ja     | 抹茶, 緑茶            | 日本酒, ビール      | —                                                                              | 抹茶      |
| ko     | 바나나우유, 식혜      | 소주, 막걸리        | —                                                                              | 소주      |
| zh_CN  | 茶, 奶茶              | 白酒                | —                                                                              | 奶茶      |
| zh_TW  | 珍珠奶茶              | 高粱酒, 台啤        | —                                                                              | 珍奶      |
| ru     | Чай, квас             | Водка               | Online alcohol advertising restricted; vodka is a stereotype                   | Чай       |
| pl     | Kompot                | Wódka, piwo         | Alcohol advertising restricted (spirits banned); vodka is a stereotype         | Kompot    |
| th     | ชาไทย                 | เบียร์, สาโท        | Alcoholic Beverage Control Act 2008 bans alcohol advertising; Buddhist precept | ชาไทย     |
| tr     | Çay, Türk kahvesi     | Rakı                | Muslim-majority; alcohol promotion restricted                                  | Çay       |
| id     | Kopi, es teh          | Tuak                | Muslim-majority; alcohol sales and advertising restricted                      | Kopi      |
| vi     | Cà phê sữa đá, trà đá | Bia hơi             | —                                                                              | Cà phê    |
| ar     | قهوة عربية, شاي       | —                   | Muslim-majority; alcohol banned or restricted in most Arabic-speaking states   | قهوة      |

Legal notes are a rough check, not legal advice.

Preview a locale with `yarn preview:locale <locale>` (see [README](../README.md#previewing-a-locale)).
