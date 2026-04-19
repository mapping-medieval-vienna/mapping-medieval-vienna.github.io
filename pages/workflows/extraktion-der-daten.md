# Extraktion der Daten

TODO 

## Ortsangaben

## Datumsangaben

## Umwandlung des Formulars in TEI

Der Text soll trotz der zugefügten Information lesbar bleiben. Gleichzeitig soll die Nomenklatur nicht TEI durch die Hintertür neu erfinden. Für die Anzeige der Edition muss der Text in TEI umgewandelt werden. Das passiert dann aber auf Knopfdruck mit einem Skript. 

Für die Anzeige wird die diplomatische Version und die Formular-Version mit einem Skript zu einer TEI-konformen Version zusammengebracht. Das sieht dann (zurzeit) so aus:

diplomatisch:
```
<seg><rs type="von">Als daz von Hansen <lb facs="#facs_371_r2l8" n="N007"/>Scharffenperger</rs> 
<measure type="preis" commodity="101 tl.">umb hundert und ain phunt d.</measure> 
<rs type="ereignis" ref="#kauf">mit kauf an Sy <lb facs="#facs_371_r2l9" n="N008"/>komen ist</rs></seg> 
```

(`@commodity` ist eine nicht vorgesehene Verwendung dieses Attributs, aber wir haben noch kein eigenes MMV-spezifisches Attribut definiert.)

Formular:
```
<lb/><seg><rs type="von">Als daz von Hansen Scharffenperger</rs>
<lb/>101 tl.Ⓟ<measure type="preis">umb hundert und ain phunt d.</measure>
<lb/>kaufⒺ<rs type="ereignis">mit kauf an Sy komen ist</rs></seg>
```

In der Anzeige sieht das dann gut aus, nur arbeiten möchten wir mit dieser Version nicht. Die Daten leben weiterhin in den Textdateien. Wir bewahren auch die aus der Formularansicht herausgezogenen Informationen nicht in TEI auf. 

