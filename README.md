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

## Technika i porady
Każde ćwiczenie ma opis techniki krok po kroku i porady (plik `technique.js`). Stuknij nazwę ćwiczenia w bazie, planie albo w trakcie treningu.

## Technologia
Plik `index.html` (HTML + CSS + JavaScript, bez frameworków i bez serwera) oraz `exercises.js` z bazą ćwiczeń.
Dane zapisywane są w `localStorage` przeglądarki. Kopię zapasową można skopiować i przywrócić w zakładce Plan.

## Uruchomienie
Otwórz `index.html` w przeglądarce albo wejdź na stronę GitHub Pages repozytorium.

## Instalacja na telefonie
Aplikacja jest PWA: `manifest.webmanifest`, ikony w `icons/`, a `sw.js` zapisuje pliki w pamięci telefonu, więc działa bez internetu (poza funkcjami AI).
1. Włącz GitHub Pages: Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, folder `/ (root)`.
2. Otwórz adres strony na telefonie.
   - Android (Chrome): menu ⋮ → *Zainstaluj aplikację* / *Dodaj do ekranu głównego*.
   - iPhone (Safari): przycisk Udostępnij → *Do ekranu początkowego*.
3. Dane są zapisane na telefonie. Żeby przenieść dane z podglądu na claude.ai: Plan → Kopia zapasowa → *Kopiuj dane* tam, potem *Przywróć* w zainstalowanej aplikacji.

Po zmianie plików aplikacji podbij `VERSION` w `sw.js`, żeby telefony pobrały nową wersję.

## Podgląd na claude.ai
`python3 tools/artifact.py index.html podglad.html` usuwa bloki `pwa:start…pwa:end` (doctype, head), bo podgląd dokłada własny szkielet strony.
