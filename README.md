# Dziennik Siłowni

Osobista aplikacja na siłownię działająca w przeglądarce (także na telefonie).

## Funkcje
- **Planuj** – osobne, nazwane plany (np. „Push Pull Legs”, „FBW na wyjazd”), jeden aktywny; dni treningowe i ćwiczenia (serie × powtórzenia). W tej zakładce jest też baza 178 ćwiczeń (11 partii, nazwy PL/EN, podział wg sprzętu, technika i porady) oraz ustawienia (AI, kopia zapasowa, instalacja)
- **Trenuj** – dzisiejszy dzień z aktywnego planu, zapis serii (kg × powtórzenia) z podpowiedzią ostatniego wyniku i rekordu, notatka po treningu
- **Obserwuj** – własne wpisy z kategoriami, waga ciała i historia treningów
- **Wnioskuj** – automatyczne wnioski z danych, wykresy najcięższej serii, objętości i wagi ciała
- **Radź** – porada dnia i ogólne wskazówki

## Wygląd
Każda partia mięśniowa ma swój kolor i mapę mięśni. Karta każdego ćwiczenia ma też mapę obciążenia: zbliżenie na pracujące mięśnie z podziałem na aktony (np. głowy bicepsa, części piersiowego, aktony naramiennego), w kolorach: główne, pomocnicze, stabilizujące (dane w `muscles.js`). Każde ćwiczenie ma też animację ruchu 3D: przycisk „Animacja 3D” w karcie ćwiczenia otwiera ją na pełnym ekranie. Postać ze sprzętem stoi na podłodze, kamera powoli krąży, a palcem można ją obrócić. Pracujące mięśnie świecą kolorami mapy obciążenia, mocniej w fazie podnoszenia, a licznik pokazuje procent wysiłku i fazę ruchu. Są też licznik powtórzeń, pauza i wolne tempo (pozy w `anim.js`, scena 3D w `anim3d.js`). **Kreator planu** (Planuj → Plany → Kreator planu) układa plan w 7 krokach: cel (masa, siła, rzeźba, forma), poziom, partie z suwakami priorytetu sumującymi się do 100, liczba treningów i minut z doborem podziału (FBW, Góra/Dół, PPL), sprzęt z wykluczaniem każdego rodzaju, kontuzje stawów, mięśnie do odciążenia lub omijania i wykluczone ćwiczenia, a na końcu podgląd: serie na partię w tygodniu, zamiana ćwiczenia na sugerowany zamiennik lub dowolne z bazy i zapis jako nazwany plan. Gdy AI jest dostępne (konto Claude albo własny klucz), plan układa AI na podstawie odpowiedzi z kreatora; bez AI układa go algorytm. Ćwiczenia w dniu są pogrupowane partiami, od dużych do małych. Przycisk „Dopracuj z AI” poprawia plan z uwzględnieniem dopisanych życzeń (`kreator.js`). Ekran Trenuj otwiera baner z dzisiejszym dniem, pierścieniem treningów w tygodniu i serią tygodni z rzędu. Nowy rekord ciężaru nagradza medal z konfetti.

## Dodawanie ćwiczeń z AI
W Planuj → Ćwiczenia: opisz ćwiczenie albo zrób zdjęcie maszyny, a AI zaproponuje nazwę polską i angielską, partię, sprzęt i wskazówkę techniczną. Opis można podyktować po polsku (przycisk Podyktuj). Otwarta z claude.ai aplikacja korzysta z konta Claude (bez klucza). Poza claude.ai potrzebny jest własny klucz API (Planuj → Ustawienia), zapisywany tylko w przeglądarce.

## Technika i porady
Każde ćwiczenie ma opis techniki krok po kroku i porady (plik `technique.js`). Stuknij nazwę ćwiczenia w bazie, planie albo w trakcie treningu.

## Technologia
Plik `index.html` (HTML + CSS + JavaScript, bez frameworków i bez serwera) oraz `exercises.js` z bazą ćwiczeń.
Dane zapisywane są w `localStorage` przeglądarki. Kopię zapasową można skopiować i przywrócić w Planuj → Ustawienia.

## Uruchomienie
Otwórz `index.html` w przeglądarce albo wejdź na stronę GitHub Pages repozytorium.

## Instalacja na telefonie
Aplikacja jest PWA: `manifest.webmanifest`, ikony w `icons/`, a `sw.js` zapisuje pliki w pamięci telefonu, więc działa bez internetu (poza funkcjami AI).
1. Włącz GitHub Pages: Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, folder `/ (root)`.
2. Otwórz adres strony na telefonie.
   - Android (Chrome): menu ⋮ → *Zainstaluj aplikację* / *Dodaj do ekranu głównego*.
   - iPhone (Safari): przycisk Udostępnij → *Do ekranu początkowego*.
3. Dane są zapisane na telefonie. Żeby przenieść dane z podglądu na claude.ai: Planuj → Ustawienia → Kopia zapasowa → *Kopiuj dane* tam, potem *Przywróć* w zainstalowanej aplikacji.

Po zmianie plików aplikacji podbij `VERSION` w `sw.js`, żeby telefony pobrały nową wersję.

## Podgląd na claude.ai
`python3 tools/artifact.py index.html podglad.html` usuwa bloki `pwa:start…pwa:end` (doctype, head), bo podgląd dokłada własny szkielet strony.
