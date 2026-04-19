# Formular-Erstellung

Für die Auswertung muss die Formular-Ansicht erstellt werden, die [hier](formular-ansicht.md) genauer beschrieben ist. Konkret müssen die Einträge in Formular-Slots aufgeteilt und die Rollen der Slots markiert werden. Anschließend müssen die Angaben in den Slots normalisiert und mit kontrolliertem Vokabular und IDs versehen werden. 

Die diplomatische Version und die Formularversion sind in getrennten Dateien. Mit einem Skript wird regelmäßig kontrolliert, ob der zugrundeliegende Text in beiden Dateien noch identisch ist. 

Wir arbeiten mit reinen Textdateien, immer und ohne Ausnahme UTF-8. Formal sind diese Textdateien auch TEI-Dateien, also insbesondere Dateiformat XML. Die Dateien bearbeiten wir mit einem Texteditor, der mit RegExes umgehen kann. Konkret verwenden wir BBEdit auf dem Mac. Daneben verwenden wir selbstgeschriebene Python-Skripte. Zur Überprüfung, ob das TEI wohlgeformt ist, verwenden wir Oxygen.


## Entscheidungen bei der Formular-Ansicht

Nur ein kleiner Teil der Einträge folgt dem Schema perfekt. Die genaue Einteilung hängt auch davon ab, was dem Lesefluss nützt. Zum Beispiel wird in den Gewerbüchern das Objekt oft wieder aufgenommen. Eine komplexe Wiederaufnahme wie "als dasselb halb haws" (GB-D 0052-6) bekommt eine eigene Zeile:

```
ⒶAndre Kelhaimer burger zu Wienn 
ⓗhat emphangen nucz und gewer 

Ⓞains halben hawss 
Ⓛganczes gelegen undern fleischpenkchen 
Ⓝam placz zenagst des Angerfelder haws 
```

```
als dasselb halb haws 
mit allen gemechen und gemainen stukchen die nach lautt der tailbrief darczu gehornt 
Ⓟumb funfczehen hundert phunt phenning 
Ⓥvon Hainreichen Frankchen seinem swager 
Ⓔmit kauf an In komen ist 
nach lautt ains kaufbriefs den er darumb hat 
```

Ein einfaches "als das" wird dagegen einfach in einen anderen Formular-Slot integriert:

```
ⒶAndre Kelhaimer Burger zu Wienn 
ⓗhat emphangen nucz und gewer 

Ⓞains hawss 
Ⓛgelegen in der vodern Pekchenstrazz 
Ⓝzenagst Wolfgangs Hertting haws 
```

```
Als daz von dem Erwurdigen geistlichen herren hern Wolfgangen Abt und seinem Convent des gaczhauss zu Pawmgartenstern 
Ⓟumb virdhalb hundert phunt phenning 
Ⓔmit kauf an In komen ist 
```

Ein Problem ist daher, dass die Semantik der Zeilenumbrüche nicht immer einheitlich und damit für ein Skript nicht immer verständlich ist. Manchmal sind sie nur da, um es für Menschen lesbarer zu machen. Wir arbeiten noch an einem Kompromiss zwischen Lesbarkeit für Menschen und automatischer Auswertbarkeit. Zum Beispiel kann ein Skript die Wiederaufnahme 

```
als dasselb halb haws 
mit allen gemechen und gemainen stukchen die nach lautt der tailbrief darczu gehornt 
```

einfach ignorieren. Das ist für das Skript auch leicht erkennbar, weil die Zeilen direkt nach einer Leerzeile stehen und keine Markierung haben.

## Weitere Themen

### Anfang und Ende eines Slots

Normalerweise entspricht eine Zeile einem Slot. Bestimmte Slots wie Ⓥ können zur besseren Lesbarkeit auch über mehrere Zeilen gehen. Bei einer Leerzeile ist ein Slot definitiv zuende. 

TODO: Falls genauere Markierungen nötig werden, können wir eine Schreibweise wie 

```
Ⓐdem erbern mann #Veiten dem Valkchner#
und frawn #Barbaren seiner hausfrawn#
```

ergänzen. Mit oder ohne TEI haben wir noch keine richtige Idee, wie ich das hier markieren würden:

```
ⓋLinhart und Thoman gebruder die Taler bey Ryed gesessen 
und Dyemut Ir Swester Hainreich des Nuendorffer auch bey Ryed hausfraw 
alle drew Cristans aus dem Tal seligen kinder
```

### Einträge mit mehreren Ereignissen

Das `an` in einem Ereignis entspricht normalerweise dem `von` im nächsten Ereignis. 

Insbesondere die Markierung der Ereignisse ist auch bei mir noch experimentell. Aber allgemein habe ich bei einem Eintrag einen Anfangszustand (d.h. wem das Haus gehört) und ein oder mehrere Ereignisse, die jeweils einen neuen Zustand bewirken. Das kann ich so markieren und durchnummerieren. Für unsere Daten ist es sinnvoll, nicht die Reihenfolge im Text, sondern die logische Reihenfolge zu verwenden (oft ist das auch das gleiche). Wenn also ein komplexer Eintrag mit drei Ereignissen anfängt mit

Hainreich Stumphwegk der sneider und Anna sein hausfraw 
habent emphangen nucz und gewer 

dann wäre das LⒶ, also das "an" des letzten Ereignisses.

Es müssen nicht alle Zustände und Ereignisse explizit dastehen. Zum Beispiel kann dastehen "das Haus, das vorher X und seiner Frau Y gehört hat" oder "das X und seine Frau Y gekauft hatten". Beides bedeutet, dass der Eintrag davor hoffentlich geendet hat mit dem Zustand "X und Y besitzen das Haus". Aber auch die Schreiber wollten ja, dass man die Einträge später noch versteht. 

Zum Beispiel die Hauspreise kann ich jederzeit mit einem Skript aus dem Text in eine Tabelle kopieren. Aber die Daten leben in der Formularansicht, nicht in einer Datenbank. Korrekturen würde ich in der Formularansicht machen und die entsprechende Tabelle dann auf Knopfdruck aktualisieren. Mit Ereignissen werde ich es ähnlich wie mit Preisen machen, aber Ereignisse sind komplexer und zurzeit sitzt auch eine SHK daran, Ereignisse herauszuziehen. Und die Daten sind immer nur so gut, wie sie im Text markiert wurden, aber das ist bei einer von Hand erstellten Excel-Tabelle ja nicht anders. 


