# Dziennik Siłowni

Osobista aplikacja na siłownię działająca w przeglądarce (także na telefonie).

## Funkcje
- **Trening** – wybór dnia z planu, zapis serii (kg × powtórzenia), notatka po treningu
- **Plan** – dni treningowe i ćwiczenia (serie × powtórzenia), edycja
- **Ćwiczenia** – baza ponad 60 ćwiczeń pogrupowanych partiami mięśniowymi, z nazwą polską i angielską, wyszukiwarka i dodawanie do planu
- **Postępy** – wykresy najcięższej serii, objętości treningowej i wagi ciała
- **Porady** – porada dnia i ogólne wskazówki
- **Obserwacje** – własne wpisy z kategoriami oraz automatyczne wnioski z danych

## Technologia
Plik `index.html` (HTML + CSS + JavaScript, bez frameworków i bez serwera) oraz `exercises.js` z bazą ćwiczeń.
Dane zapisywane są w `localStorage` przeglądarki. Kopię zapasową można skopiować i przywrócić w zakładce Plan.

## Uruchomienie
Otwórz `index.html` w przeglądarce.
