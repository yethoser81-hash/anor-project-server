import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final cameras = await availableCameras();
  runApp(AnorCheckApp(camera: cameras.first));
}

class AnorCheckApp extends StatelessWidget {
  final CameraDescription camera;
  const AnorCheckApp({super.key, required this.camera});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(fontFamily: 'Segoe UI'),
      home: ScanScreen(camera: camera),
    );
  }
}

class ScanScreen extends StatefulWidget {
  final CameraDescription camera;
  const ScanScreen({super.key, required this.camera});
  @override
  ScanScreenState createState() => ScanScreenState();
}

class ScanScreenState extends State<ScanScreen> {
  late CameraController _controller;

  @override
  void initState() {
    super.initState();
    _controller = CameraController(widget.camera, ResolutionPreset.high);
    _controller.initialize().then((_) {
      if (!mounted) return;
      setState(() {});
    });
  }

  Future<void> lancerScanSilencieux() async {
    final image = await _controller.takePicture();

    var request = http.MultipartRequest('POST',
        Uri.parse('https://authbyyetho.onrender.com/api/produit/verifier'));
    request.files.add(await http.MultipartFile.fromPath('sceau', image.path));

    // Identifiant réseau système
    request.fields['network_cell_id'] = "NETWORK_CELL_IDENTIFIER";

    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);

    // Protection contre l'utilisation du contexte après fermeture de l'écran
    if (!mounted) return;

    if (response.statusCode == 200) {
      var data = json.decode(response.body);
      Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) => ResultScreen(produit: data['produit'])));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_controller.value.isInitialized) {
      return const Scaffold(backgroundColor: Colors.black);
    }
    return Scaffold(
      body: Stack(children: [
        CameraPreview(_controller),
        Center(
          child: Container(
            width: 270,
            height: 270,
            decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF008751), width: 5)),
          ),
        ),
        Positioned(
            bottom: 50,
            left: 20,
            right: 20,
            child: ElevatedButton(
                onPressed: lancerScanSilencieux,
                style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF008751),
                    padding: const EdgeInsets.all(15)),
                child: const Text("SCANNER LE SCEAU",
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold))))
      ]),
    );
  }
}

class ResultScreen extends StatelessWidget {
  final Map produit;
  const ResultScreen({super.key, required this.produit});

  @override
  Widget build(BuildContext context) {
    bool isCameroun =
        (produit['pays_origine'] ?? "").toLowerCase() == 'cameroun';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
          title: const Text("ANOR - Vérification"),
          backgroundColor: const Color(0xFF008751)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(22.0),
        child: Column(children: [
          if (produit['url_visuel'] != null)
            Image.network(produit['url_visuel']),
          const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text("✓ PRODUIT CERTIFIÉ CONFORME",
                  style: TextStyle(
                      color: Color(0xFF008751), fontWeight: FontWeight.bold))),
          _buildInfoRow("Produit", produit['nom_produit'] ?? 'N/A'),
          _buildInfoRow("Entreprise", produit['nom_producteur'] ?? 'N/A'),
          _buildInfoRow("Origine", produit['pays_origine'] ?? 'N/A'),
          _buildInfoRow("N° Lot", produit['lot'] ?? 'N/A'),
          if (!isCameroun) ...[
            _buildInfoRow("Fabrication", produit['date_fabrication'] ?? 'N/A'),
            _buildInfoRow("Validité", produit['date_peremption'] ?? 'N/A'),
          ] else ...[
            _buildInfoRow("Validité Certificat",
                produit['date_certificat_conformite'] ?? 'N/A'),
          ]
        ]),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label.toUpperCase(),
            style: const TextStyle(fontSize: 10, color: Colors.grey)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ]),
    );
  }
}
