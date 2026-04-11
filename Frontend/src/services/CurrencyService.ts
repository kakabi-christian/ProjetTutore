// services/CurrencyService.ts
import axios from 'axios';

export interface CurrencyData {
  code: string;
  name: string;
  flag: string;
}

const CurrencyService = {
  async getAllCurrencies(): Promise<CurrencyData[]> {
    try {
      const response = await axios.get('https://restcountries.com/v3.1/all?fields=currencies,flags');
      const currenciesMap = new Map<string, CurrencyData>();

      response.data.forEach((country: any) => {
        if (country.currencies) {
          Object.keys(country.currencies).forEach((code) => {
            if (!currenciesMap.has(code)) {
              currenciesMap.set(code, {
                code: code,
                name: country.currencies[code].name,
                flag: country.flags.svg // URL du logo/drapeau
              });
            }
          });
        }
      });

      // Trier par code alphabétique
      return Array.from(currenciesMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      console.error("Erreur lors de la récupération des devises", error);
      return [];
    }
  }
};

export default CurrencyService;