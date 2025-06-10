<?php
$servername = "localhost";
$username = "root"; // sau alt user
$password = "";     // parola ta
$dbname = "magazin_vanatori";

// Conectare
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Conexiune eșuată: " . $conn->connect_error);
}

// Preluare date
$nume = $_POST['nume'];
$prenume = $_POST['prenume'];
$email = $_POST['email'];
$telefon = $_POST['telefon'];
$adresa = $_POST['adresa'];
$cantitate = $_POST['cantitate'];
$produs = $_POST['produs'];

// Inserare în DB
$sql = "INSERT INTO comenzi (nume, prenume, email, telefon, adresa, cantitate, produs)
        VALUES ('$nume', '$prenume', '$email', '$telefon', '$adresa', '$cantitate', '$produs')";

if ($conn->query($sql) === TRUE) {
    header("Location: magazin.html"); // sau altă pagină de mulțumire
    exit();
} else {
    echo "Eroare la salvarea comenzii: " . $conn->error;
}

$conn->close();
?>
