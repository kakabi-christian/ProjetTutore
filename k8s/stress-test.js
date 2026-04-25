import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // On monte de 0 à 20 utilisateurs en 30 secondes
    { duration: '1m', target: 100 },  // On monte à 100 utilisateurs pendant 1 minute
    { duration: '20s', target: 0 },  // On redescend à 0
  ],
};

export default function () {
  // On cible l'URL de ton backend exposé sur le NodePort
  http.get('http://localhost:30766/');
  sleep(1); // Chaque utilisateur attend 1 seconde entre chaque requête
}