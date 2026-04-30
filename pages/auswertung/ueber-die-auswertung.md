# Auswertung

Voraussetzung für die Auswertung war ein maschinenlesbarer Text. Die [Transkription](info.html?p=workflows/transkription) der vier ausgewählten Grundbücher erfolgte unter Zuhilfenahme von Transkribus. Es war dabei nicht unser Anspruch, die Handschriften diplomatisch zu transkribieren, sondern den Text leichter lesbar, durchsuchbar und bearbeitbar zu machen. Dabei haben wir klare  [Transkriptionsrichtlinien](info.html?p=workflows/transkriptionsrichtlinien) befolgt.


## Häuser in Wien

Hauptziel des Projekts war es, die Besitzhistorie einer jeden im Grundbuch genannten Liegenschaft zu rekonstruieren und ihre ungefähre Lage auf dem Stadtplan zu ermitteln. 
<!-- Das Ergebnis finden Sie [hier](info.html?p=auswertung/haeuser). -->

Die Herausforderung bestand vor allem darin, dass die Position einer Immobilie an einem Verkehrsweg über die benachbarten Objekte referenziert wird, da das Konzept der Hausnummer noch unbekannt war. 

## Formular-Ansicht

Deswegen haben wir ein an das Formular der Grundbücher angelehntes Annotationsschema entwickelt, durch das die essenziellen Informationen für die Lösung des Häuserpuzzles erfasst werden können. Für eine ausführliche Beschreibung siehe [Formular-Ansicht](info.html?p=auswertung/formular-ansicht). 

Dass die Grundbuch-Einträge grob einem Formular folgen, ist seit längerem bekannt. Die Idee, dies als Formular-Ansicht für eine Grundbuch-Edition umzusetzen, ist jedoch neu. Wir nennen die Formular-Ansicht und die Markierungen der Formular-Slots deshalb das _Berliner Modell_. 

Die konzise Form der Formularstruktur und der Annotationen ist leicht lesbar und bearbeitbar, ohne dass ein XML-Editor verwendet werden muss. Sie dient deshalb als Basis für die weitere Analyse. Weil die Formular-Slots keine feste Reihenfolge haben und ihre Rollen auch nicht sofort vergeben werden müssen, ist diese flexible Darstellung auch geeigneter als eine Datenbank mit festen Feldern. 

Für die online-Edition wird die Formularstruktur durch ein Skript in das bei digitalen Editionen übliche Datenformat TEI umgewandelt, die zeilengetreue Transkription liegt von vornherein als TEI vor. 

