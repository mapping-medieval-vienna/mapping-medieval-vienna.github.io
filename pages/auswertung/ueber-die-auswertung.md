# Auswertung

Voraussetzung für die Auswertung war ein maschinenlesbarer Text. Die [Transkription](transkription.md) der vier ausgewählten Grundbücher erfolgte unter Zuhilfenahme von Transkribus. Es war dabei nicht unser Anspruch, die Handschriften diplomatisch zu transkribieren, sondern den Text leichter lesbar, durchsuchbar und bearbeitbar zu machen. Beschrieben sind die Transkriptionsrichtlinien [hier](transkriptionsrichtlinien.md). 


## Häuser in Wien

Hauptziel des Projekts war es, die Besitzhistorie einer jeden im Grundbuch genannten Liegenschaft zu rekonstruieren und ihre ungefähre Lage auf dem Stadtplan zu ermitteln. Das Ergebnis finden Sie [hier](haeuser.md). 

Die Herausforderung bestand vor allem darin, dass die Position einer Immobilie an einem Verkehrsweg über die benachbarten Objekte referenziert wird, da das Konzept der Hausnummer noch unbekannt war. Deswegen haben wir ein an das Formular der Grundbücher angelehntes Annotationsschema entwickelt, durch das die essenziellen Informationen für die Lösung des Häuserpuzzles erfasst werden können. Eine Beschreibung der Auszeichnungsmethode befindet sich hier [hier](formular-ansicht.md). 


## Formular-Ansicht statt TEI

Mit TEI kann man gut beschreiben, wie der Text aussieht, mit Seitenumbrüchen, Zeilenumbrüchen, durchgestrichenen Stellen etc. So wird der Text dann auch in der Edition angezeigt.

Für die Formularansicht wollten wir erreichen, dass der Text auch ohne XML-Viewer lesbar und bearbeitbar bleibt. Die Formular-Teile hätte man auch in TEI markieren können, aber oft hat TEI nichts direkt Passendes zu bieten. Wir sehen zum Beispiel keinen Grund, zum Beispiel
```
101 tl.Ⓟumb hundert und ain phunt d. 
```
irgendwie TEI-konform auszudrücken. 

Dass die Grundbuch-Einträge grob einem Formular folgen, ist seit längerem bekannt. Die Idee, dies als Formular-Ansicht für eine Grundbuch-Edition umzusetzen, ist jedoch neu. Wir nennen die Formular-Ansicht und die Markierungen der Formular-Slots deshalb das _Berliner Modell_. 
