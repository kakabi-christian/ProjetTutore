import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Montée à 20 utilisateurs
    { duration: '1m', target: 100 }, // Pic à 100 (le HPA va chauffer !)
    { duration: '20s', target: 0 },  // Redescente
  ],
};

export default function () {
  const url = 'http://127.0.0.1:30766/api/login';
  
  // On simule une tentative de connexion
  // Même si l'utilisateur n'existe pas, Laravel va travailler pour vérifier le mot de passe
  const payload = JSON.stringify({
    email: 'test-stress@exchapay.com',
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  // On vérifie que le serveur répond (401 ou 422 est normal ici si l'user n'existe pas, 
  // l'essentiel est que le serveur ne réponde pas par une erreur 500 ou un échec de connexion)
  check(res, {
    'is not 500': (r) => r.status !== 500,
    'is not 404': (r) => r.status !== 404,
  });

  sleep(1);
}