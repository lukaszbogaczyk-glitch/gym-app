# Dziennik Siłowni

Osobista aplikacja na siłownię działająca w przeglądarce (także na telefonie).

## Funkcje
- **Trening** – wybór dnia z planu, zapis serii (kg × powtórzenia), notatka po treningu
- **Plan** – dni treningowe i ćwiczenia (serie × powtórzenia), edycja
- **Ćwiczenia** – baza 178 ćwiczeń w 11 grupach pogrupowanych partiami mięśniowymi, z nazwą polską i angielską, wyszukiwarka i dodawanie do planu
- **Postępy** – wykresy najcięższej serii, objętości treningowej i wagi ciała
- **Porady** – porada dnia i ogólne wskazówki
- **Obserwacje** – własne wpisy z kategoriami oraz automatyczne wnioski z danych

## Wygląd
Każda partia mięśniowa ma swój kolor i mapę mięśni. Ekran Treningu otwiera baner z dzisiejszym dniem, pierścieniem treningów w tygodniu i serią tygodni z rzędu. Nowy rekord ciężaru nagradza medal z konfetti.

## Dodawanie ćwiczeń z AI
W zakładce Ćwiczenia: opisz ćwiczenie albo zrób zdjęcie maszyny, a AI zaproponuje nazwę polską i angielską, partię, sprzęt i wskazówkę techniczną. Opis można podyktować po polsku (przycisk Podyktuj). Otwarta z claude.ai aplikacja korzysta z konta Claude (bez klucza). Poza claude.ai potrzebny jest własny klucz API (Plan → Ustawienia AI), zapisywany tylko w przeglądarce.

## Technologia
Plik `index.html` (HTML + CSS + JavaScript, bez frameworków i bez serwera) oraz `exercises.js` z bazą ćwiczeń.
Dane zapisywane są w `localStorage` przeglądarki. Kopię zapasową można skopiować i przywrócić w zakładce Plan.

## Uruchomienie
Otwórz `index.html` w przeglądarce.
