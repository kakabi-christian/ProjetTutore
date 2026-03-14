<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Liste des Filières</title>
    <style>
        /* Configuration des marges de la page */
        @page {
            margin: 100px 50px 80px 50px;
        }
        
        body { 
            font-family: 'Helvetica', sans-serif; 
            font-size: 11px; 
            color: #333; 
            margin: 0;
            padding: 0;
        }

        /* En-tête fixe sur chaque page */
        header {
            position: fixed;
            top: -75px;
            left: 0;
            right: 0;
            height: 60px;
            text-align: center;
            border-bottom: 2px solid #0d6efd;
        }

        /* Pied de page fixe sur chaque page */
        footer {
            position: fixed;
            bottom: -50px;
            left: 0;
            right: 0;
            height: 30px;
            text-align: left;
            font-size: 9px;
            border-top: 1px solid #ddd;
            padding-top: 5px;
        }

        .title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #0d6efd;
            margin-top: 10px;
        }

        table { 
            width: 100%; 
            border-collapse: collapse;
        }
        
        th, td { 
            border: 1px solid #dee2e6; 
            padding: 8px; 
            text-align: left; 
        }
        
        th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
            text-transform: uppercase;
        }

        tr:nth-child(even) { 
            background-color: #f2f2f2; 
        }

        main {
            margin-top: 10px;
        }
    </style>
</head>
<body>

    <header>
        <div class="title">SYSTÈME DE SUIVI ACADÉMIQUE</div>
        <div style="font-style: italic;">Rapport Officiel : Liste des Filières</div>
    </header>

    <footer>
        Généré le : {{ date('d/m/Y H:i') }} | Source : Base de données académique
    </footer>

    <main>
        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Libellé / Nom</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                @foreach($filieres as $filiere)
                <tr>
                    <td style="font-weight: bold;">{{ $filiere->code_filiere }}</td>
                    <td>{{ $filiere->label_filiere }}</td>
                    <td>{{ $filiere->desc_filiere ?? 'N/A' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </main>

    <script type="text/php">
        if ( isset($pdf) ) {
            $font = $fontMetrics->get_font("helvetica", "bold");
            $size = 9;
            $color = array(0,0,0);
            $text = "Page {PAGE_NUM} sur {PAGE_COUNT}";
            
            // Calcul de la position (Bas-Droite)
            $x = $pdf->get_width() - 100;
            $y = $pdf->get_height() - 35;
            
            $pdf->page_text($x, $y, $text, $font, $size, $color);
        }
    </script>

</body>
</html>