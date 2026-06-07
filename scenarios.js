/* ============================================================
   SCENARIOS — baza scenariuszy zgłoszeń (schematy blokowe)
   Każdy scenariusz = obiekt z węzłami (nodes).
   Typy węzłów:
     decision : pytanie z opcjami -> options:[{label,to}]
     step     : instrukcja (list / cmds) + next
     end      : zakończenie, kind: resolved | escalate | info
   Aby dodać scenariusz — dopisz kolejny obiekt do tablicy.
   ============================================================ */
const SCENARIOS=[

/* ============ 1. SIECI ============ */
{id:'net',title:'Brak dostępu do internetu',cat:'Sieci',c:'var(--net)',icon:'net',
 desc:'Diagnoza krok po kroku — od warstwy fizycznej, przez DHCP i bramę, aż po DNS.',start:'q_scope',
 nodes:{
  q_scope:{type:'decision',title:'Określ zakres problemu',text:'Czy w tym samym miejscu inni użytkownicy też nie mają internetu?',options:[{label:'Tak — wielu użytkowników',to:'a_mass'},{label:'Nie — tylko ten użytkownik',to:'q_ip'},{label:'Nie wiem / nie da się sprawdzić',to:'q_ip'}]},
  a_mass:{type:'end',kind:'escalate',title:'Awaria masowa',text:'Sprawdź urządzenia sieciowe (switch, router, AP) i status łącza u dostawcy. To problem infrastruktury — eskaluj do zespołu sieciowego, zgłoś do ISP i poinformuj użytkowników.'},
  q_ip:{type:'decision',title:'Sprawdź adres IP',text:'Wykonaj <code>ipconfig /all</code>. Jaki adres IPv4 ma karta?',options:[{label:'Poprawny adres (np. 192.168.x.x)',to:'q_gw'},{label:'169.254.x.x (APIPA)',to:'a_dhcp'},{label:'Brak adresu / media disconnected',to:'s_phys'}]},
  a_dhcp:{type:'step',title:'Problem z DHCP',text:'APIPA oznacza brak adresu z serwera DHCP. Odnów dzierżawę:',cmds:[['ipconfig /release','zwolnij adres'],['ipconfig /renew','pobierz nowy z DHCP']],next:'q_dhcp_ok'},
  q_dhcp_ok:{type:'decision',title:'Czy karta dostała adres?',options:[{label:'Tak, jest poprawny adres',to:'q_gw'},{label:'Nadal 169.254.x.x',to:'a_dhcp_esc'}]},
  a_dhcp_esc:{type:'end',kind:'escalate',title:'Serwer DHCP nie odpowiada',text:'Sprawdź kabel/port i czy inni dostają adresy. Możliwe wyczerpanie puli lub awaria serwera/scope DHCP — eskaluj do sieciowców.'},
  s_phys:{type:'step',title:'Sprawdź warstwę fizyczną',text:'Brak adresu wskazuje na brak połączenia fizycznego.',list:['Kabel wpięty z obu stron? Dioda link świeci?','Spróbuj inny kabel i inny port','Wi-Fi: połączony z właściwą siecią? jest sygnał?','Wyłącz i włącz kartę sieciową'],next:'q_phys_ok'},
  q_phys_ok:{type:'decision',title:'Czy jest połączenie (link)?',options:[{label:'Tak, jest link',to:'q_ip'},{label:'Nie, nadal brak',to:'a_phys_esc'}]},
  a_phys_esc:{type:'end',kind:'escalate',title:'Uszkodzenie sprzętu lub okablowania',text:'Brak linku mimo wymiany kabla i portu — podejrzenie karty sieciowej, gniazda lub okablowania. Zgłoś do serwisu / sieciowców.'},
  q_gw:{type:'decision',title:'Test bramy domyślnej',text:'Wykonaj <code>ping</code> bramy (adres z ipconfig). Odpowiada?',options:[{label:'Tak, brama odpowiada',to:'q_inet'},{label:'Nie odpowiada',to:'a_gw_esc'}]},
  a_gw_esc:{type:'end',kind:'escalate',title:'Problem w sieci lokalnej',text:'Host ma IP, ale nie widzi bramy — switch, router, VLAN lub zapora. Eskaluj do zespołu sieciowego.'},
  q_inet:{type:'decision',title:'Test internetu i DNS',text:'<code>ping 8.8.8.8</code> oraz <code>ping example.com</code>. Co działa?',options:[{label:'IP działa, nazwy NIE',to:'a_dns'},{label:'Ani IP, ani nazwy',to:'a_inet_esc'},{label:'Oba pingi działają',to:'a_app'}]},
  a_dns:{type:'step',title:'Problem z DNS',text:'Łączność jest, zawodzi rozwiązywanie nazw.',cmds:[['ipconfig /flushdns','wyczyść cache DNS'],['nslookup example.com 8.8.8.8','test innego serwera']],list:['Sprawdź serwer DNS na karcie','Sprawdź plik hosts: C:\\Windows\\System32\\drivers\\etc\\hosts'],next:'q_dns_ok'},
  q_dns_ok:{type:'decision',title:'Czy nazwy działają?',options:[{label:'Tak',to:'a_dns_res'},{label:'Nie',to:'a_dns_esc'}]},
  a_dns_res:{type:'end',kind:'resolved',title:'Rozwiązane — DNS',text:'Po poprawie DNS rozwiązywanie nazw działa. Udokumentuj przyczynę.'},
  a_dns_esc:{type:'end',kind:'escalate',title:'Problem z serwerem DNS',text:'Nazwy nadal się nie rozwiązują — możliwa awaria serwera DNS lub reguła zapory. Eskaluj.'},
  a_inet_esc:{type:'end',kind:'escalate',title:'Brak trasy do internetu',text:'Brama odpowiada, ruch nie wychodzi — routing, NAT, firewall lub awaria ISP. Eskaluj.'},
  a_app:{type:'end',kind:'info',title:'Sieć działa — sprawdź aplikację',text:'Łączność i DNS OK — problem po stronie aplikacji/przeglądarki. Sprawdź proxy, wyczyść cache, sprawdź datę/czas (certyfikaty).'},
 }},

/* ============ 2. SPRZĘT ============ */
{id:'printer',title:'Drukarka nie drukuje',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Od kolejki wydruku i sterownika po drukarkę sieciową i materiały eksploatacyjne.',start:'q_scope',
 nodes:{
  q_scope:{type:'decision',title:'Określ zakres',text:'Czy problem dotyczy też innych osób na tej drukarce?',options:[{label:'Tak (drukarka sieciowa)',to:'s_net'},{label:'Nie, tylko ten użytkownik',to:'q_queue'}]},
  s_net:{type:'step',title:'Sprawdź drukarkę i sieć',text:'Skoro dotyczy wielu osób — zacznij od urządzenia i łączności.',list:['Drukarka włączona, online, bez błędu na panelu?','Jest papier i toner/tusz? Brak zacięcia?','Pingnij IP drukarki','Sprawdź kolejkę na serwerze wydruku','Zrestartuj drukarkę (~30 s)'],next:'q_net_ok'},
  q_net_ok:{type:'decision',title:'Wróciła do pracy?',options:[{label:'Tak',to:'a_net_res'},{label:'Nie',to:'a_net_esc'}]},
  a_net_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Drukarka działa. Udokumentuj przyczynę.'},
  a_net_esc:{type:'end',kind:'escalate',title:'Eskaluj — drukarka/serwer',text:'Problem urządzenia lub serwera wydruku dotyczący wielu osób. Eskaluj do administratora serwera wydruku / serwisu.'},
  q_queue:{type:'decision',title:'Co dzieje się przy drukowaniu?',options:[{label:'Zadania utykają / błąd',to:'s_spooler'},{label:'Drukarka offline w Windows',to:'s_offline'},{label:'Brak drukarki na liście',to:'s_add'},{label:'Drukuje, ale źle (puste/smugi)',to:'a_consum'}]},
  s_spooler:{type:'step',title:'Zresetuj bufor wydruku',text:'Zawieszone zadania blokują kolejkę.',cmds:[['net stop spooler','zatrzymaj bufor'],['del /Q /F %systemroot%\\System32\\spool\\PRINTERS\\*','wyczyść kolejkę'],['net start spooler','uruchom ponownie']],next:'q_spool_ok'},
  q_spool_ok:{type:'decision',title:'Pomogło?',options:[{label:'Tak, drukuje',to:'a_spool_res'},{label:'Nie',to:'s_driver'}]},
  a_spool_res:{type:'end',kind:'resolved',title:'Rozwiązane — zawieszona kolejka',text:'Restart spoolera pomógł. Jeśli się powtarza — sprawdź sterownik lub dokument.'},
  s_offline:{type:'step',title:'Przywróć online',text:'Status offline często da się cofnąć.',list:['Ustawienia → Drukarki → odznacz Użyj w trybie offline','Zrestartuj drukarkę','Sieciowa: pingnij IP; gdy zmienione — dodaj ponownie'],next:'q_off_ok'},
  q_off_ok:{type:'decision',title:'Online i drukuje?',options:[{label:'Tak',to:'a_off_res'},{label:'Nie',to:'s_driver'}]},
  a_off_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Drukarka wróciła online.'},
  s_add:{type:'step',title:'Dodaj drukarkę',text:'Dodaj urządzenie ponownie.',list:['Ustawienia → Dodaj urządzenie','Sieciowa: po nazwie \\\\serwer\\drukarka lub IP','Zainstaluj właściwy sterownik','Sprawdź uprawnienia (GPO/grupa)'],next:'q_add_ok'},
  q_add_ok:{type:'decision',title:'Udało się?',options:[{label:'Tak',to:'a_add_res'},{label:'Nie',to:'a_driver_esc'}]},
  a_add_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Drukarka dodana i działa.'},
  s_driver:{type:'step',title:'Przeinstaluj sterownik',text:'Najczęstsza twarda przyczyna.',list:['Usuń drukarkę i sterownik','Pobierz właściwy sterownik od producenta','Dodaj ponownie i wydrukuj stronę testową'],next:'q_drv_ok'},
  q_drv_ok:{type:'decision',title:'Drukuje po reinstalacji?',options:[{label:'Tak',to:'a_drv_res'},{label:'Nie',to:'a_driver_esc'}]},
  a_drv_res:{type:'end',kind:'resolved',title:'Rozwiązane — sterownik',text:'Reinstalacja sterownika pomogła. Zanotuj wersję.'},
  a_driver_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Mimo sterownika i kolejki nie działa — eskaluj (usterka sprzętu lub serwer wydruku).'},
  a_consum:{type:'end',kind:'info',title:'Materiały / serwis',text:'Zła jakość (puste, smugi) = toner/tusz, bęben, głowica. Wymień materiał lub zgłoś serwis — to nie konfiguracja.'},
 }},

/* ============ 3. TOŻSAMOŚĆ ============ */
{id:'account',title:'Konto zablokowane / reset hasła',cat:'Tożsamość',c:'var(--ad)',icon:'ad',
 desc:'Bezpieczna obsługa blokad, resetów i odrzucanych logowań — z weryfikacją tożsamości.',start:'q_verify',
 nodes:{
  q_verify:{type:'decision',title:'Najpierw zweryfikuj tożsamość',text:'Zanim coś zmienisz na koncie — potwierdź tożsamość zgodnie z procedurą firmy. Potwierdzona?',options:[{label:'Tak, potwierdzona',to:'q_type'},{label:'Nie / wątpliwości',to:'a_noverify'}]},
  a_noverify:{type:'end',kind:'escalate',title:'Nie wykonuj zmian',text:'Bez potwierdzonej tożsamości nie odblokowuj ani nie resetuj — to wektor inżynierii społecznej. Postępuj wg procedury lub eskaluj do bezpieczeństwa.'},
  q_type:{type:'decision',title:'Czego dotyczy zgłoszenie?',options:[{label:'Konto zablokowane (za dużo prób)',to:'s_unlock'},{label:'Zapomniane hasło / reset',to:'s_reset'},{label:'Hasło wygasło',to:'s_expired'},{label:'Logowanie odrzucane mimo dobrego hasła',to:'q_block'}]},
  s_unlock:{type:'step',title:'Odblokuj i znajdź przyczynę',list:['AD: Unlock-ADAccount (lub dsa.msc)','Entra: portal → odblokuj','Źródło blokad: stare hasło w telefonie, dyskach, sesjach'],next:'q_unlock_ok'},
  q_unlock_ok:{type:'decision',title:'Logowanie działa?',options:[{label:'Tak',to:'a_unlock_res'},{label:'Nie / blokuje ponownie',to:'s_reset'}]},
  a_unlock_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Konto odblokowane. Wskaż userowi źródło blokady i poproś o aktualizację zapisanych haseł.'},
  s_reset:{type:'step',title:'Zresetuj hasło bezpiecznie',list:['AD: Set-ADAccountPassword -Reset + zmiana przy logowaniu','Entra/M365: reset w portalu lub SSPR','Hasło tymczasowe bezpiecznym kanałem (nie zwykłym mailem)','Zaproponuj odświeżenie MFA'],next:'a_reset_res'},
  a_reset_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Hasło zresetowane z wymuszeniem zmiany. Zamknij po potwierdzeniu przez usera.'},
  s_expired:{type:'step',title:'Hasło wygasło',list:['Na stacji w domenie: Ctrl+Alt+Del → Zmień hasło','Zdalnie/M365: zmiana w portalu lub reset','Przypomnij o aktualizacji haseł w aplikacjach mobilnych'],next:'a_exp_res'},
  a_exp_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Nowe hasło ustawione. Przypomnij o aktualizacji tam, gdzie było zapisane.'},
  q_block:{type:'decision',title:'Gdzie logowanie jest odrzucane?',options:[{label:'Aplikacja chmurowa / M365',to:'a_ca'},{label:'Komputer w domenie',to:'a_trust'},{label:'Dopiero po zmianie hasła',to:'a_cached'}]},
  a_ca:{type:'end',kind:'info',title:'Sprawdź Conditional Access / MFA',text:'Sprawdź sign-in logs w Entra: powód, lokalizacja, stan urządzenia, MFA. Często polityka Conditional Access lub nieukończona rejestracja MFA.'},
  a_trust:{type:'end',kind:'escalate',title:'Relacja zaufania komputera',text:'„Trust relationship failed" = zerwane konto komputera. Re-join domeny lub Reset-ComputerMachinePassword. Brak uprawnień → eskaluj.'},
  a_cached:{type:'end',kind:'info',title:'Stare hasło w pamięci',text:'Zaktualizuj zapisane hasła i wyczyść Menedżer poświadczeń (profil poczty, dyski, Wi-Fi enterprise, sesje).'},
 }},

/* ============ 4. WINDOWS ============ */
{id:'slowpc',title:'Komputer działa wolno',cat:'Windows',c:'var(--win)',icon:'win',
 desc:'Lokalizacja wąskiego gardła (CPU/RAM/dysk) i typowe przyczyny spowolnień.',start:'q_when',
 nodes:{
  q_when:{type:'decision',title:'Kiedy jest wolno?',options:[{label:'Ogólnie / cały czas',to:'q_res'},{label:'Głównie przy starcie',to:'s_startup'},{label:'Tylko konkretna aplikacja',to:'s_app'},{label:'Tylko z zasobami sieciowymi',to:'a_net'}]},
  s_startup:{type:'step',title:'Wolny rozruch',list:['Menedżer zadań → Uruchamianie → wyłącz zbędne','SSD czy HDD? (HDD bardzo wydłuża start)','Czy nie trwa instalacja aktualizacji przy starcie'],next:'q_start_ok'},
  q_start_ok:{type:'decision',title:'Start przyspieszył?',options:[{label:'Tak',to:'a_generic_res'},{label:'Nie',to:'s_basic'}]},
  s_app:{type:'step',title:'Wolna aplikacja',list:['Menedżer zadań → zużycie tej aplikacji','Zaktualizuj lub przeinstaluj','Wyczyść cache / sprawdź profil aplikacji','Test na innym koncie/komputerze'],next:'q_app_ok'},
  q_app_ok:{type:'decision',title:'Działa płynnie?',options:[{label:'Tak',to:'a_generic_res'},{label:'Nie',to:'a_app_esc'}]},
  a_app_esc:{type:'end',kind:'escalate',title:'Eskaluj — aplikacja',text:'Eskaluj do zespołu wspierającego aplikację z opisem zużycia zasobów i kroków.'},
  q_res:{type:'decision',title:'Co jest obciążone? (Menedżer zadań)',options:[{label:'CPU blisko 100%',to:'a_cpu'},{label:'RAM blisko 100%',to:'a_ram'},{label:'Dysk 100%',to:'a_disk'},{label:'Nic się nie wyróżnia',to:'s_basic'}]},
  a_cpu:{type:'step',title:'Wysokie CPU',list:['Posortuj procesy po CPU','Skanowanie AV / aktualizacja? (poczekaj)','Nieznany proces → skan Defender (malware)','Temperatury — przegrzanie = throttling'],next:'q_generic_ok'},
  a_ram:{type:'step',title:'Brak wolnej RAM',list:['Zamknij zbędne aplikacje i karty','Sprawdź wyciek pamięci → restart aplikacji','Za mało RAM jak na zadania → rozbudowa'],next:'q_generic_ok'},
  a_disk:{type:'step',title:'Dysk 100%',list:['Proces obciążający (Update, SysMain, indeksowanie)','Wolne miejsce na C:?','Stan dysku SMART — HDD blisko awarii bywa wolny','HDD: defrag; SSD: TRIM'],next:'q_disk_ok'},
  q_disk_ok:{type:'decision',title:'Lepiej?',options:[{label:'Tak',to:'a_generic_res'},{label:'Nie, SMART pokazuje problem',to:'a_disk_esc'},{label:'Nie, SMART OK',to:'s_basic'}]},
  a_disk_esc:{type:'end',kind:'escalate',title:'Dysk do wymiany',text:'Błędy SMART / stałe 100% = umierający dysk. Zabezpiecz dane i zgłoś wymianę.'},
  s_basic:{type:'step',title:'Podstawowe czyszczenie',list:['Restart komputera','Wyczyść pliki tymczasowe i Kosz','Pełne skanowanie Defender','Zaległe aktualizacje Windows i sterowników'],next:'q_generic_ok'},
  q_generic_ok:{type:'decision',title:'Działa lepiej?',options:[{label:'Tak',to:'a_generic_res'},{label:'Nie',to:'a_generic_esc'}]},
  a_generic_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Wydajność wróciła do normy. Udokumentuj.'},
  a_generic_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj z notatką o obciążeniu i krokach — możliwa głębsza przyczyna sprzętowa/systemowa.'},
  a_net:{type:'end',kind:'info',title:'Wolno tylko z siecią',text:'Dotyczy tylko dysków sieciowych/serwera → diagnoza sieci/serwera (patrz scenariusze sieciowe).'},
 }},

/* ============ 5. MFA ============ */
{id:'mfa',title:'MFA nie działa / nowy telefon',cat:'Tożsamość',c:'var(--ad)',icon:'ad',
 desc:'Brak kodu, zgubiony lub wymieniony telefon z Authenticatorem.',start:'q_verify',
 nodes:{
  q_verify:{type:'decision',title:'Zweryfikuj tożsamość',text:'Potwierdź tożsamość zgłaszającego (procedura firmy). Potwierdzona?',options:[{label:'Tak',to:'q_what'},{label:'Nie',to:'a_noverify'}]},
  a_noverify:{type:'end',kind:'escalate',title:'Nie zmieniaj MFA',text:'Reset MFA bez weryfikacji to klasyczny atak (SIM-swap/social engineering). Eskaluj do bezpieczeństwa.'},
  q_what:{type:'decision',title:'Na czym polega problem?',options:[{label:'Nie przychodzi kod / push',to:'s_nocode'},{label:'Nowy lub zgubiony telefon',to:'s_reset'},{label:'Za dużo próśb / spam push',to:'a_fatigue'}]},
  s_nocode:{type:'step',title:'Brak kodu/push',list:['Sprawdź czas na telefonie (kody TOTP wymagają zsynchronizowanego czasu)','Sprawdź internet/powiadomienia w aplikacji Authenticator','Spróbuj kodu z aplikacji zamiast push','Wyczyść kolejkę i ponów logowanie'],next:'q_nocode_ok'},
  q_nocode_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_reset'}]},
  s_reset:{type:'step',title:'Reset metody MFA',list:['Entra → Użytkownik → Authentication methods → usuń starą metodę','Poproś usera o ponowną rejestrację na aka.ms/mfasetup','Rozważ tymczasowy TAP (Temporary Access Pass) do rejestracji','Zaproponuj klucz/aplikację zamiast SMS'],next:'a_res'},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Metoda MFA działa / przerejestrowana. Udokumentuj, jak potwierdzono tożsamość.'},
  a_fatigue:{type:'end',kind:'info',title:'MFA fatigue — uwaga na atak',text:'Lawina próśb push może oznaczać, że ktoś zna hasło i bombarduje usera. NIE zatwierdzać push. Zmień hasło, włącz number matching, sprawdź sign-in logs.'},
 }},

/* ============ 6. ONBOARDING ============ */
{id:'onboard',title:'Onboarding — nowy pracownik',cat:'Tożsamość',c:'var(--ad)',icon:'ad',
 desc:'Utworzenie konta i przygotowanie dostępu dla nowej osoby.',start:'q_req',
 nodes:{
  q_req:{type:'decision',title:'Masz formalne zgłoszenie?',text:'Czy jest zatwierdzony wniosek od HR/przełożonego (stanowisko, dział, data startu)?',options:[{label:'Tak',to:'s_create'},{label:'Nie',to:'a_need'}]},
  a_need:{type:'end',kind:'escalate',title:'Brak podstawy',text:'Nie twórz kont na podstawie nieformalnej prośby. Poproś o zatwierdzony wniosek (HR/manager) — to też kwestia bezpieczeństwa i licencji.'},
  s_create:{type:'step',title:'Utwórz konto i tożsamość',list:['Załóż konto w AD/Entra wg konwencji nazewnictwa','Dodaj do właściwej OU/działu i grup (model AGDLP)','Przypisz licencję M365 (lub przez grupę)','Utwórz skrzynkę / dodaj do list dystrybucyjnych'],next:'s_access'},
  s_access:{type:'step',title:'Dostępy i sprzęt',list:['Dostęp do zasobów wg roli (zasada najmniejszych uprawnień)','Przygotuj urządzenie (Autopilot/obraz, Intune enrollment)','Hasło startowe + wymuszenie zmiany, rejestracja MFA','Dostęp do drukarek, VPN, aplikacji'],next:'a_res'},
  a_res:{type:'end',kind:'resolved',title:'Gotowe',text:'Konto, dostępy i sprzęt przygotowane. Przekaż dane logowania bezpiecznym kanałem i udokumentuj w zgłoszeniu.'},
 }},

/* ============ 7. OFFBOARDING ============ */
{id:'offboard',title:'Offboarding — odejście pracownika',cat:'Tożsamość',c:'var(--sec)',icon:'sec',
 desc:'Bezpieczne wyłączenie dostępu odchodzącej osoby.',start:'q_when',
 nodes:{
  q_when:{type:'decision',title:'Kiedy ma nastąpić odcięcie?',text:'Czy to natychmiastowe (zwolnienie/ryzyko) czy planowe (ostatni dzień)?',options:[{label:'Natychmiastowe',to:'s_now'},{label:'Planowe',to:'s_plan'}]},
  s_now:{type:'step',title:'Natychmiastowe odcięcie',list:['Wyłącz konto (nie usuwaj od razu) i zresetuj hasło','Wyloguj wszystkie sesje (revoke sessions w Entra)','Cofnij dostęp VPN i do kluczowych systemów','Zablokuj/usuń urządzenia firmowe z MDM'],next:'s_data'},
  s_plan:{type:'step',title:'Planowe odcięcie',list:['W dniu odejścia wyłącz konto','Ustaw skrzynkę jako współdzieloną lub przekaż dostęp przełożonemu','Zbierz sprzęt, wyrejestruj z MDM','Cofnij licencje po zabezpieczeniu danych'],next:'s_data'},
  s_data:{type:'step',title:'Dane i dostępy',list:['Przekaż pliki OneDrive/maile wskazanej osobie','Zdejmij z grup, list dystrybucyjnych, aplikacji','Po okresie retencji — usuń wg polityki'],next:'a_res'},
  a_res:{type:'end',kind:'resolved',title:'Gotowe',text:'Dostęp odcięty, dane zabezpieczone, sprzęt odebrany. Udokumentuj zgodnie z procedurą i listą kontrolną offboardingu.'},
 }},

/* ============ 8. FOLDER WSPÓŁDZIELONY ============ */
{id:'share',title:'Brak dostępu do folderu współdzielonego',cat:'Tożsamość',c:'var(--ad)',icon:'ad',
 desc:'Zmapowany dysk lub udział sieciowy odmawia dostępu.',start:'q_who',
 nodes:{
  q_who:{type:'decision',title:'Kogo dotyczy?',options:[{label:'Wszystkich w dziale',to:'a_server'},{label:'Tylko tego użytkownika',to:'q_msg'}]},
  a_server:{type:'end',kind:'escalate',title:'Problem po stronie serwera',text:'Skoro nikt nie ma dostępu — serwer plików, udział lub usługa jest niedostępna. Eskaluj do administratora serwera.'},
  q_msg:{type:'decision',title:'Jaki komunikat?',options:[{label:'Odmowa dostępu (uprawnienia)',to:'s_perm'},{label:'Nie znaleziono ścieżki / dysk zniknął',to:'s_path'}]},
  s_perm:{type:'step',title:'Sprawdź uprawnienia',list:['Czy user jest w grupie dającej dostęp do udziału?','Dodaj do właściwej grupy (model AGDLP), nie nadawaj bezpośrednio','Po dodaniu — wyloguj/zaloguj (odświeżenie tokenu grup)','Sprawdź uprawnienia NTFS i Share (mniej restrykcyjne wygrywa Share vs NTFS)'],next:'q_perm_ok'},
  q_perm_ok:{type:'decision',title:'Jest dostęp?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  s_path:{type:'step',title:'Odtwórz mapowanie',list:['Sprawdź, czy ścieżka istnieje: \\\\serwer\\udzial','Zmapuj ponownie: net use Z: \\\\serwer\\udzial /persistent:yes','Jeśli mapuje GPO — sprawdź gpresult /r i przynależność do grupy'],next:'q_path_ok'},
  q_path_ok:{type:'decision',title:'Dysk dostępny?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Dostęp przywrócony. Udokumentuj, czy chodziło o grupę czy mapowanie.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Mimo poprawnych grup i ścieżki brak dostępu — eskaluj do administratora serwera plików.'},
 }},

/* ============ 9. PROŚBA O DOSTĘP ============ */
{id:'accessreq',title:'Prośba o dostęp do aplikacji/systemu',cat:'Tożsamość',c:'var(--ad)',icon:'ad',
 desc:'Standardowy service request o nadanie uprawnień.',start:'q_appr',
 nodes:{
  q_appr:{type:'decision',title:'Czy jest zatwierdzenie?',text:'Czy prośba ma akceptację właściciela systemu/przełożonego?',options:[{label:'Tak',to:'s_grant'},{label:'Nie',to:'a_appr'}]},
  a_appr:{type:'end',kind:'info',title:'Potrzebna akceptacja',text:'Nie nadawaj dostępu bez zatwierdzenia właściciela zasobu — to zasada najmniejszych uprawnień i ścieżka audytu. Skieruj do procesu akceptacji.'},
  s_grant:{type:'step',title:'Nadaj dostęp',list:['Dodaj usera do odpowiedniej grupy uprawnień (nie nadawaj indywidualnie)','Sprawdź wymaganą licencję/rolę','Poinformuj o sposobie logowania i ewentualnym MFA'],next:'q_ok'},
  q_ok:{type:'decision',title:'User ma dostęp?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Dostęp nadany przez grupę. Udokumentuj kto zatwierdził.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Dostęp nie działa mimo grupy — eskaluj do właściciela/administratora aplikacji.'},
 }},

/* ============ 10. M365 LOGIN ============ */
{id:'m365login',title:'Nie mogę zalogować się do Microsoft 365',cat:'Microsoft 365',c:'var(--m365)',icon:'m365',
 desc:'Problem z logowaniem do M365 / Office / portalu.',start:'q_msg',
 nodes:{
  q_msg:{type:'decision',title:'Jaki komunikat?',options:[{label:'Złe hasło / nie pamiętam',to:'a_pass'},{label:'Konto zablokowane',to:'a_lock'},{label:'Logowanie odrzucone / zablokowane',to:'s_ca'},{label:'Wszyscy mają problem',to:'a_health'}]},
  a_pass:{type:'end',kind:'info',title:'Reset hasła',text:'Skieruj usera do SSPR (aka.ms/sspr) lub zresetuj hasło po weryfikacji tożsamości — patrz scenariusz „Konto zablokowane / reset hasła".'},
  a_lock:{type:'end',kind:'info',title:'Odblokowanie',text:'Przejdź do scenariusza „Konto zablokowane / reset hasła" — odblokuj po weryfikacji tożsamości.'},
  s_ca:{type:'step',title:'Sprawdź logi i polityki',list:['Entra → Sign-in logs: powód błędu i lokalizacja','Stan urządzenia (compliant?) i wymóg MFA','Sprawdź Conditional Access (kraj, urządzenie, ryzyko)','Czy MFA zarejestrowane?'],next:'q_ca_ok'},
  q_ca_ok:{type:'decision',title:'Po korekcie działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Logowanie działa. Udokumentuj przyczynę (np. polityka, MFA).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora tożsamości z wyciągiem z sign-in logs.'},
  a_health:{type:'end',kind:'info',title:'Sprawdź Service Health',text:'Jeśli problem dotyczy wielu osób — sprawdź Microsoft 365 Service Health w centrum administracyjnym; może to globalna awaria Microsoftu.'},
 }},

/* ============ 11. OUTLOOK WYSYŁ ============ */
{id:'outsend',title:'Outlook nie wysyła poczty',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Wiadomości utykają w skrzynce nadawczej lub wracają.',start:'q_sym',
 nodes:{
  q_sym:{type:'decision',title:'Co się dzieje?',options:[{label:'Wiadomość utyka w Skrzynce nadawczej',to:'q_conn'},{label:'Wraca z błędem (NDR/bounce)',to:'a_ndr'},{label:'Tylko duże załączniki',to:'a_size'}]},
  q_conn:{type:'decision',title:'Outlook jest połączony?',text:'Sprawdź status na dole Outlooka.',options:[{label:'Pokazuje „Rozłączono / Praca offline"',to:'s_off'},{label:'Połączony',to:'s_stuck'}]},
  s_off:{type:'step',title:'Przywróć połączenie',list:['Wstążka Wyślij/Odbierz → odznacz Pracuj w trybie offline','Sprawdź internet (ping/strona)','Restart Outlooka'],next:'q_ok'},
  s_stuck:{type:'step',title:'Odblokuj zawieszoną wiadomość',list:['Otwórz Skrzynkę nadawczą, usuń/popraw zawieszoną wiadomość (często duży załącznik lub zły adres)','Wyślij/Odbierz ręcznie (F9)','Uruchom Outlook w trybie awaryjnym (outlook.exe /safe) — test dodatków'],next:'q_ok'},
  a_ndr:{type:'end',kind:'info',title:'Przeczytaj kod NDR',text:'Komunikat zwrotny zawiera powód: zły adres (5.1.1), pełna skrzynka odbiorcy, odrzucenie przez serwer. Popraw adres lub sprawdź Message Trace. Powtarzalne odrzucenia → eskaluj.'},
  a_size:{type:'end',kind:'info',title:'Limit załącznika',text:'Domyślny limit to ok. 25 MB. Wyślij plik przez OneDrive/SharePoint jako link zamiast załącznika.'},
  q_ok:{type:'decision',title:'Wysyła?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Poczta wychodzi. Udokumentuj przyczynę.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Nadal nie wysyła — sprawdź profil Outlooka / Message Trace lub eskaluj do administratora Exchange.'},
 }},

/* ============ 12. OUTLOOK ODBIÓR ============ */
{id:'outrecv',title:'Outlook nie odbiera nowej poczty',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Brak nowych wiadomości lub niepełna synchronizacja.',start:'q_web',
 nodes:{
  q_web:{type:'decision',title:'Czy poczta jest w OWA?',text:'Zaloguj się do Outlook w przeglądarce (outlook.office.com). Czy nowe maile tam są?',options:[{label:'Tak, w przeglądarce są',to:'s_client'},{label:'Nie ma ich nawet w przeglądarce',to:'a_flow'}]},
  s_client:{type:'step',title:'Problem z klientem Outlook',list:['Wyślij/Odbierz (F9); sprawdź Pracuj offline','Sprawdź filtry/widok i regułę przenoszącą maile','Napraw profil: Panel sterowania → Mail → napraw konto','Outlook /safe — test dodatków'],next:'q_ok'},
  a_flow:{type:'end',kind:'info',title:'Maile w ogóle nie docierają',text:'Skoro brak ich też w OWA — sprawdź Message Trace (czy dotarły), regułę przekierowania/usuwania na skrzynce, kwarantannę i listę zablokowanych nadawców. Możliwe przejęcie konta lub reguła — sprawdź też scenariusz bezpieczeństwa.'},
  q_ok:{type:'decision',title:'Odbiera?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Poczta synchronizuje się. Udokumentuj przyczynę.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora Exchange z wynikiem Message Trace.'},
 }},

/* ============ 13. OUTLOOK START ============ */
{id:'outstart',title:'Outlook się nie uruchamia',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Błąd przy starcie, np. „nie można otworzyć zestawu folderów".',start:'s_safe',
 nodes:{
  s_safe:{type:'step',title:'Uruchom w trybie awaryjnym',text:'Sprawdź, czy winne są dodatki.',cmds:[['outlook.exe /safe','start bez dodatków']],list:['Jeśli w trybie awaryjnym działa → wyłącz dodatki (Plik → Opcje → Dodatki)'],next:'q_safe_ok'},
  q_safe_ok:{type:'decision',title:'W trybie awaryjnym działa?',options:[{label:'Tak (winne dodatki)',to:'a_addin'},{label:'Nie, nadal błąd',to:'s_profile'}]},
  a_addin:{type:'end',kind:'resolved',title:'Rozwiązane — dodatek',text:'Wyłącz problematyczny dodatek i uruchom normalnie. Udokumentuj który.'},
  s_profile:{type:'step',title:'Napraw / odtwórz profil',list:['Panel sterowania → Mail → Pokaż profile → utwórz nowy profil','Napraw plik OST: zamknij Outlook, usuń .ost (odbuduje się)','Uruchom Microsoft SaRA (Support and Recovery Assistant)'],next:'q_prof_ok'},
  q_prof_ok:{type:'decision',title:'Startuje?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_repair'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Outlook startuje. Zanotuj, czy chodziło o profil/OST.'},
  s_repair:{type:'step',title:'Napraw Office',list:['Panel sterowania → Programy → Microsoft 365 → Zmień → Szybka naprawa','Jeśli nie pomoże → Naprawa online'],next:'q_rep_ok'},
  q_rep_ok:{type:'decision',title:'Pomogło?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Mimo naprawy profilu i Office nie startuje — eskaluj (możliwa reinstalacja lub problem skrzynki).'},
 }},

/* ============ 14. SKRZYNKA PEŁNA ============ */
{id:'mboxfull',title:'Skrzynka pełna / przekroczono limit',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Brak miejsca blokuje wysyłanie/odbieranie.',start:'s_clean',
 nodes:{
  s_clean:{type:'step',title:'Zwolnij miejsce',list:['Opróżnij Elementy usunięte i folder Spam','Usuń/zarchiwizuj duże wiadomości (sortuj po rozmiarze)','Włącz Archiwum online / autoarchiwizację','Sprawdź folder Elementy wysłane'],next:'q_ok'},
  q_ok:{type:'decision',title:'Jest miejsce, działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie / limit za mały',to:'a_quota'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Miejsce zwolnione. Zaproponuj userowi archiwizację na przyszłość.'},
  a_quota:{type:'end',kind:'info',title:'Zwiększ limit / archiwum',text:'Jeśli skrzynka stale pełna — w Exchange admin center zwiększ limit (do dozwolonego maksimum) lub włącz In-Place Archive. Wymaga uprawnień admina — w razie potrzeby eskaluj.'},
 }},

/* ============ 15. SKRZYNKA WSPÓŁDZIELONA ============ */
{id:'sharedmbox',title:'Nie działa skrzynka współdzielona',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Brak widoczności lub uprawnień do wspólnej skrzynki.',start:'q_sym',
 nodes:{
  q_sym:{type:'decision',title:'Na czym polega problem?',options:[{label:'Skrzynka się nie pojawia',to:'s_perm'},{label:'Nie da się wysyłać „w imieniu"',to:'a_sendas'}]},
  s_perm:{type:'step',title:'Nadaj/odśwież uprawnienia',list:['Exchange admin → skrzynka współdzielona → Delegacja → Full Access dla usera','Auto-mapowanie zwykle dodaje ją po ~60 min / po restarcie Outlooka','Można dodać ręcznie: Plik → Ustawienia kont → dodatkowa skrzynka'],next:'q_ok'},
  a_sendas:{type:'end',kind:'info',title:'Uprawnienie Send As / Send on Behalf',text:'Wysyłanie wymaga osobnego uprawnienia „Send As" lub „Send on Behalf" w Exchange admin center. Nadaj odpowiednie i odczekaj na propagację.'},
  q_ok:{type:'decision',title:'Widzi i działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Skrzynka dostępna. Udokumentuj nadane uprawnienie.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Mimo uprawnień brak dostępu — eskaluj do administratora Exchange.'},
 }},

/* ============ 16. SPAM/DOSTARCZALNOŚĆ ============ */
{id:'maildeliver',title:'Wiadomość nie dociera / trafia do spamu',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Problem z dostarczeniem poczty do/od odbiorcy.',start:'q_dir',
 nodes:{
  q_dir:{type:'decision',title:'Kierunek problemu?',options:[{label:'Nasz user nie dostaje maila',to:'s_in'},{label:'Mail od nas trafia do spamu odbiorcy',to:'a_out'}]},
  s_in:{type:'step',title:'Sprawdź dostarczenie',list:['Message Trace — czy mail dotarł do serwera','Sprawdź Spam/Kwarantannę i listę zablokowanych nadawców','Sprawdź reguły skrzynki (przenoszenie/usuwanie)'],next:'q_in_ok'},
  q_in_ok:{type:'decision',title:'Znaleziono?',options:[{label:'Był w spamie/kwarantannie',to:'a_in_res'},{label:'W ogóle nie dotarł',to:'a_in_esc'}]},
  a_in_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Zwolnij z kwarantanny i dodaj nadawcę do zaufanych. Udokumentuj.'},
  a_in_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Mail nie dotarł nawet do serwera — problem po stronie nadawcy/MX. Eskaluj do administratora poczty.'},
  a_out:{type:'end',kind:'info',title:'Rekordy uwierzytelniania poczty',text:'Maile do spamu u odbiorców to zwykle SPF/DKIM/DMARC domeny. Sprawdź rekordy DNS domeny i reputację. To konfiguracja domeny — eskaluj do administratora poczty/DNS.'},
 }},

/* ============ 17. TEAMS START ============ */
{id:'teams',title:'Teams nie uruchamia się / błąd logowania',cat:'Microsoft 365',c:'var(--m365)',icon:'m365',
 desc:'Aplikacja Teams nie startuje, zawiesza się lub nie loguje.',start:'s_basic',
 nodes:{
  s_basic:{type:'step',title:'Szybkie kroki',list:['Zamknij Teams całkowicie (z zasobnika) i uruchom ponownie','Sprawdź internet i status logowania M365','Sprawdź Service Health (czy nie ma awarii)'],next:'q_basic_ok'},
  q_basic_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_cache'}]},
  s_cache:{type:'step',title:'Wyczyść cache Teams',list:['Zamknij Teams','Wyczyść folder cache (np. %appdata%\\Microsoft\\Teams lub nowy klient w %localappdata%)','Uruchom ponownie i zaloguj się','Alternatywa: wersja web teams.microsoft.com'],next:'q_cache_ok'},
  q_cache_ok:{type:'decision',title:'Po czyszczeniu działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_reinst'}]},
  s_reinst:{type:'step',title:'Przeinstaluj / sprawdź licencję',list:['Sprawdź, czy user ma licencję obejmującą Teams','Odinstaluj i zainstaluj ponownie klienta','Sprawdź wersję web jako obejście'],next:'q_re_ok'},
  q_re_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Teams działa. Udokumentuj (cache/reinstalacja/licencja).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora M365 z opisem błędu i sprawdzonej licencji.'},
 }},

/* ============ 18. TEAMS AUDIO ============ */
{id:'teamsaudio',title:'Brak dźwięku / mikrofonu na spotkaniu',cat:'Microsoft 365',c:'var(--m365)',icon:'m365',
 desc:'Problemy z mikrofonem lub głośnikami w Teams/spotkaniach.',start:'q_what',
 nodes:{
  q_what:{type:'decision',title:'Co nie działa?',options:[{label:'Mnie nie słychać (mikrofon)',to:'s_mic'},{label:'Ja nie słyszę (głośniki)',to:'s_spk'}]},
  s_mic:{type:'step',title:'Mikrofon',list:['Teams → Ustawienia → Urządzenia → wybierz właściwy mikrofon','Sprawdź wyciszenie (przycisk mute, fizyczny przełącznik headsetu)','Windows → Ustawienia → Dźwięk → uprawnienia mikrofonu dla aplikacji','Test w Windows (Dźwięk → testuj) — jeśli też nie działa, to sterownik/sprzęt'],next:'q_ok'},
  s_spk:{type:'step',title:'Głośniki/słuchawki',list:['Teams → Ustawienia → Urządzenia → wybierz właściwe wyjście','Sprawdź głośność systemu i miksera','Bluetooth: czy połączony i wybrany jako wyjście?','Test dźwięku w Windows'],next:'q_ok'},
  q_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_drv'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Audio działa. Najczęściej złe urządzenie wybrane w aplikacji.'},
  a_drv:{type:'end',kind:'info',title:'Sterownik/sprzęt audio',text:'Skoro nie działa też w teście Windows — zaktualizuj/przeinstaluj sterownik audio (Menedżer urządzeń) lub przetestuj inne słuchawki. Jeśli sprzęt wadliwy → wymiana.'},
 }},

/* ============ 19. KAMERA ============ */
{id:'camera',title:'Kamera nie działa na spotkaniu',cat:'Microsoft 365',c:'var(--m365)',icon:'m365',
 desc:'Brak obrazu z kamery w Teams lub innej aplikacji.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy kamery',list:['Fizyczna zaślepka/przełącznik kamery? (częsty powód)','Aplikacja: wybierz właściwą kamerę w ustawieniach','Windows → Ustawienia → Prywatność → Kamera: zezwól aplikacjom','Zamknij inne aplikacje używające kamery (mogą ją blokować)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Widać obraz?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_drv'}]},
  s_drv:{type:'step',title:'Sterownik kamery',list:['Aplikacja Kamera w Windows — czy tam działa?','Menedżer urządzeń → Kamery → zaktualizuj/uruchom ponownie sterownik','Sprawdź, czy kamera nie jest wyłączona w BIOS/zarządzaniu urządzeniami'],next:'q_drv_ok'},
  q_drv_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Kamera działa. Często to zaślepka lub uprawnienia.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Brak obrazu mimo sterownika i uprawnień — możliwa usterka kamery. Eskaluj do serwisu.'},
 }},

/* ============ 20. ONEDRIVE ============ */
{id:'onedrive',title:'OneDrive nie synchronizuje',cat:'Microsoft 365',c:'var(--m365)',icon:'m365',
 desc:'Pliki się nie synchronizują lub OneDrive utknął.',start:'s_basic',
 nodes:{
  s_basic:{type:'step',title:'Podstawy synchronizacji',list:['Sprawdź ikonę OneDrive — jaki status/błąd?','Sprawdź internet i czy user jest zalogowany','Sprawdź wolne miejsce na dysku i limit OneDrive','Nazwy plików: niedozwolone znaki lub za długa ścieżka blokują sync'],next:'q_basic_ok'},
  q_basic_ok:{type:'decision',title:'Synchronizuje?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_relink'}]},
  s_relink:{type:'step',title:'Podłącz konto ponownie',list:['OneDrive → Ustawienia → Konto → Odłącz ten komputer','Uruchom OneDrive i zaloguj się ponownie','Pliki nie znikną — pobiorą się po ponownym podłączeniu','Ostatecznie: reset OneDrive (onedrive.exe /reset)'],next:'q_relink_ok'},
  q_relink_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'OneDrive synchronizuje. Udokumentuj przyczynę (znaki w nazwie, ponowne podłączenie).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj — sprawdź limity tenanta, polityki sync lub awarię usługi (Service Health).'},
 }},

/* ============ 21. SHAREPOINT ============ */
{id:'sharepoint',title:'SharePoint — brak dostępu do witryny',cat:'Microsoft 365',c:'var(--m365)',icon:'m365',
 desc:'Użytkownik nie widzi witryny lub biblioteki dokumentów.',start:'q_who',
 nodes:{
  q_who:{type:'decision',title:'Kogo dotyczy?',options:[{label:'Wszystkich',to:'a_health'},{label:'Tylko tego użytkownika',to:'s_perm'}]},
  a_health:{type:'end',kind:'info',title:'Sprawdź Service Health',text:'Skoro nikt nie ma dostępu — sprawdź Service Health (możliwa awaria) lub czy witryna nie została zarchiwizowana/usunięta. Eskaluj do administratora SharePoint.'},
  s_perm:{type:'step',title:'Sprawdź uprawnienia',list:['Witryny M365 dziedziczą dostęp z grupy M365 — dodaj usera do grupy','Sprawdź uprawnienia witryny/biblioteki (właściciel/członek/gość)','Po dodaniu odczekaj na propagację i odśwież','Sprawdź, czy user loguje się właściwym kontem'],next:'q_ok'},
  q_ok:{type:'decision',title:'Ma dostęp?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Dostęp nadany przez grupę/uprawnienia witryny.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora/właściciela witryny SharePoint.'},
 }},

/* ============ 22. PLIK ZABLOKOWANY ============ */
{id:'filelock',title:'Plik zablokowany / „ktoś edytuje"',cat:'Microsoft 365',c:'var(--m365)',icon:'m365',
 desc:'Nie można edytować pliku, bo jest zablokowany przez innego użytkownika.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Ustal blokadę',list:['Kto edytuje? (komunikat zwykle podaje osobę) — skontaktuj się, by zamknął plik','Plik mógł zostać otwarty w aplikacji desktop i nie zwolniony','Spróbuj edycji w wersji web (współedycja) zamiast desktop','Zamknij i otwórz ponownie po kilku minutach (blokada wygasa)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Da się edytować?',options:[{label:'Tak',to:'a_res'},{label:'Nie, blokada „wisi"',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Plik odblokowany / edytowany przez web. Zalecaj współedycję online.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Blokada nie zwalnia się mimo zamknięcia przez wszystkich — eskaluj do administratora SharePoint/OneDrive (wymuszenie zwolnienia / check-in).'},
 }},

/* ============ 23. APLIKACJA CRASH ============ */
{id:'appcrash',title:'Aplikacja się zawiesza / crashuje',cat:'Oprogramowanie',c:'var(--win)',icon:'win',
 desc:'Program zamyka się sam, zawiesza lub nie reaguje.',start:'q_scope',
 nodes:{
  q_scope:{type:'decision',title:'Kiedy?',options:[{label:'Zawsze przy starcie aplikacji',to:'s_repair'},{label:'Losowo / przy konkretnej akcji',to:'s_log'}]},
  s_log:{type:'step',title:'Zbierz informacje',list:['Jaki komunikat błędu? Co user robił?','Podgląd zdarzeń → Application → szukaj błędu aplikacji','Czy ostatnio była aktualizacja systemu/aplikacji?'],next:'s_repair'},
  s_repair:{type:'step',title:'Napraw / zaktualizuj',list:['Zaktualizuj aplikację do najnowszej wersji','Wyczyść cache / dane aplikacji (lub nowy profil aplikacji)','Office: szybka naprawa → naprawa online','Uruchom jako administrator (jeśli wymaga uprawnień)'],next:'q_rep_ok'},
  q_rep_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_reinst'}]},
  s_reinst:{type:'step',title:'Przeinstaluj',list:['Odinstaluj czysto (usuń też dane jeśli trzeba)','Zainstaluj ponownie aktualną wersję','Test na innym koncie — wyklucza uszkodzony profil'],next:'q_re_ok'},
  q_re_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Aplikacja stabilna. Udokumentuj przyczynę.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do zespołu/dostawcy aplikacji z logiem z Podglądu zdarzeń i wykonanymi krokami.'},
 }},

/* ============ 24. INSTALACJA OPROGRAMOWANIA ============ */
{id:'install',title:'Instalacja oprogramowania kończy się błędem',cat:'Oprogramowanie',c:'var(--win)',icon:'win',
 desc:'Instalator nie kończy się sukcesem lub aplikacja nie startuje po instalacji.',start:'q_rights',
 nodes:{
  q_rights:{type:'decision',title:'Skąd instalacja?',text:'Czy aplikacja jest dostępna w firmowym katalogu (Company Portal/Software Center)?',options:[{label:'Tak, z firmowego katalogu',to:'s_intune'},{label:'Ręczny instalator',to:'s_manual'}]},
  s_intune:{type:'step',title:'Instalacja przez Intune',list:['Otwórz Company Portal → zainstaluj aplikację','Wymuś Sync na urządzeniu','Sprawdź logi IME: %ProgramData%\\Microsoft\\IntuneManagementExtension\\Logs','Sprawdź przypisanie aplikacji do grupy usera/urządzenia'],next:'q_ok'},
  s_manual:{type:'step',title:'Instalacja ręczna',list:['Uruchom instalator jako administrator','Sprawdź wymagania systemowe i wolne miejsce','Usuń poprzednią/uszkodzoną wersję','Sprawdź, czy polityka nie blokuje instalacji (uprawnienia)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Zainstalowane i działa?',options:[{label:'Tak',to:'a_res'},{label:'Brak uprawnień admina',to:'a_rights'},{label:'Nadal błąd',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Aplikacja zainstalowana. Udokumentuj metodę.'},
  a_rights:{type:'end',kind:'info',title:'Wymaga uprawnień',text:'User nie ma praw administratora (zasada najmniejszych uprawnień). Wdróż aplikację przez Intune/Software Center albo wykonaj instalację kontem serwisowym wg procedury — nie nadawaj userowi lokalnego admina na stałe.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj z kodem błędu instalatora / logiem IME.'},
 }},

/* ============ 25. WINDOWS UPDATE ============ */
{id:'winupdate',title:'Aktualizacja Windows nie instaluje się',cat:'Oprogramowanie',c:'var(--win)',icon:'win',
 desc:'Update zawiesza się, wraca błędem lub utyka na procentach.',start:'s_basic',
 nodes:{
  s_basic:{type:'step',title:'Podstawy',list:['Restart i ponowna próba','Sprawdź wolne miejsce na dysku (aktualizacje potrzebują kilku GB)','Uruchom narzędzie do rozwiązywania problemów z Windows Update'],next:'q_basic_ok'},
  q_basic_ok:{type:'decision',title:'Zainstalowało?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_reset'}]},
  s_reset:{type:'step',title:'Zresetuj komponenty Update',list:['Zatrzymaj usługi: net stop wuauserv i net stop bits','Zmień nazwę folderu C:\\Windows\\SoftwareDistribution','Uruchom usługi ponownie i ponów aktualizację','sfc /scannow + DISM /Online /Cleanup-Image /RestoreHealth'],next:'q_reset_ok'},
  q_reset_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Aktualizacja zainstalowana. Udokumentuj.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj z kodem błędu Windows Update; rozważ ręczny pakiet z Update Catalog lub naprawę in-place.'},
 }},

/* ============ 26. OFFICE LICENCJA ============ */
{id:'officelic',title:'Office — błąd licencji / „produkt bez licencji"',cat:'Oprogramowanie',c:'var(--m365)',icon:'m365',
 desc:'Office pokazuje brak aktywacji lub tryb tylko do odczytu.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Sprawdź konto i licencję',list:['Plik → Konto: czy zalogowany właściwym kontem służbowym?','Admin M365: czy user ma przypisaną licencję z Office?','Wyloguj i zaloguj ponownie w Office'],next:'q_ok'},
  q_ok:{type:'decision',title:'Aktywne?',options:[{label:'Tak',to:'a_res'},{label:'Brak licencji w adminie',to:'a_lic'},{label:'Licencja jest, nadal błąd',to:'s_fix'}]},
  a_lic:{type:'end',kind:'info',title:'Przypisz licencję',text:'Przypisz licencję z Office w centrum administracyjnym (lub przez grupę). Po przypisaniu odczekaj i zaloguj ponownie w aplikacji.'},
  s_fix:{type:'step',title:'Napraw aktywację',list:['Usuń stare poświadczenia (Menedżer poświadczeń)','Szybka naprawa Office, potem online','Reset licencji (cscript ospp.vbs /dstatus — diagnostyka)'],next:'q_fix_ok'},
  q_fix_ok:{type:'decision',title:'Aktywne?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Office aktywny. Udokumentuj.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora M365 (sprawdzenie przypisania i typu licencji).'},
 }},

/* ============ 27. PRZEGLĄDARKA / CERT ============ */
{id:'browser',title:'Strona się nie ładuje / błąd certyfikatu',cat:'Oprogramowanie',c:'var(--win)',icon:'win',
 desc:'Konkretna strona nie działa lub przeglądarka zgłasza problem z certyfikatem.',start:'q_scope',
 nodes:{
  q_scope:{type:'decision',title:'Co dokładnie?',options:[{label:'Błąd certyfikatu / „połączenie nie jest prywatne"',to:'a_cert'},{label:'Strona się nie ładuje (timeout/błąd)',to:'s_load'}]},
  a_cert:{type:'end',kind:'info',title:'Najpierw sprawdź datę/czas',text:'Błędy certyfikatu najczęściej wynikają ze złej daty/czasu komputera — popraw i zsynchronizuj (NTP). Jeśli to strona wewnętrzna, może brakować firmowego certyfikatu CA. Nie ucz userów klikać „kontynuuj mimo to".'},
  s_load:{type:'step',title:'Diagnoza ładowania',list:['Działa w innej przeglądarce / trybie incognito? (cache/dodatki)','Wyczyść cache i pliki cookie','Sprawdź ustawienia proxy','Inni mają ten sam problem? (strona/usługa po stronie serwera)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Ładuje się?',options:[{label:'Tak',to:'a_res'},{label:'Nie, tylko ta strona u wszystkich',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Strona działa. Najczęściej cache/dodatki/proxy.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Skoro strona/usługa nie działa dla wszystkich — eskaluj do administratora tej usługi (lub sprawdź jej status).'},
 }},

/* ============ 28. KOMPUTER SIĘ NIE WŁĄCZA ============ */
{id:'nopower',title:'Komputer się nie włącza',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Brak reakcji po naciśnięciu przycisku zasilania.',start:'q_power',
 nodes:{
  q_power:{type:'decision',title:'Jakakolwiek reakcja?',text:'Diody, wentylatory, dźwięki?',options:[{label:'Nic — całkowicie martwy',to:'s_power'},{label:'Włącza się, ale brak obrazu',to:'a_display'},{label:'Włącza i wyłącza / piszczy',to:'a_post'}]},
  s_power:{type:'step',title:'Zasilanie',list:['Laptop: podłącz oryginalny zasilacz, sprawdź diodę ładowania','Inne gniazdko / inny kabel zasilający','Stacjonarny: przełącznik na zasilaczu, kabel, listwa','Przytrzymaj przycisk zasilania 15–30 s (rozładowanie / hard reset)'],next:'q_power_ok'},
  q_power_ok:{type:'decision',title:'Włącza się?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_hw_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Komputer wystartował. Często zasilacz/kabel/rozładowanie.'},
  a_display:{type:'end',kind:'info',title:'To problem obrazu, nie zasilania',text:'Komputer działa, brakuje obrazu — przejdź do scenariusza „Brak obrazu na monitorze".'},
  a_post:{type:'end',kind:'escalate',title:'Błąd POST / sprzęt',text:'Cykl włączania lub sygnały dźwiękowe wskazują na sprzęt (RAM, płyta, zasilacz). Odczytaj kod sygnałów/diod i eskaluj do serwisu.'},
  a_hw_esc:{type:'end',kind:'escalate',title:'Eskaluj — sprzęt',text:'Brak reakcji mimo sprawdzenia zasilania — usterka sprzętowa. Zgłoś do serwisu; zapewnij userowi sprzęt zastępczy.'},
 }},

/* ============ 29. BRAK OBRAZU ============ */
{id:'nodisplay',title:'Brak obrazu na monitorze',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Komputer działa, ale monitor jest czarny lub „no signal".',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy obrazu',list:['Monitor włączony i ustawione właściwe źródło (HDMI/DP/USB-C)?','Sprawdź kabel — przepnij, spróbuj inny','Win+P → ustaw Tylko ekran komputera / Duplikuj','Stacja dokująca: wepnij monitor bezpośrednio do laptopa (test doku)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Jest obraz?',options:[{label:'Tak (winny był dok/kabel/źródło)',to:'a_res'},{label:'Nie',to:'s_gpu'}]},
  s_gpu:{type:'step',title:'Karta / sterownik',list:['Inny monitor lub inny port karty graficznej','Zaktualizuj/przeinstaluj sterownik GPU','Stacjonarny: czy kabel w karcie dedykowanej, nie w płycie?'],next:'q_gpu_ok'},
  q_gpu_ok:{type:'decision',title:'Jest obraz?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Obraz wrócił. Najczęściej dok, kabel, źródło lub sterownik.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Brak obrazu mimo testów — usterka monitora, karty lub laptopa. Eskaluj do serwisu.'},
 }},

/* ============ 30. BATERIA ============ */
{id:'battery',title:'Laptop się nie ładuje / problem z baterią',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Bateria nie ładuje się, szybko pada lub „podłączony, nie ładuje".',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Sprawdź ładowanie',list:['Oryginalny zasilacz i sprawne gniazdko? dioda ładowania?','USB-C: czy kabel i port obsługują zasilanie (nie każdy)?','Inny zasilacz/kabel do testu','Zaktualizuj sterowniki/firmware (BIOS, sterownik baterii w Menedżerze urządzeń)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Ładuje?',options:[{label:'Tak',to:'a_res'},{label:'„Podłączony, nie ładuje" / 0%',to:'a_health'},{label:'Nie ładuje wcale',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Ładowanie działa. Najczęściej zasilacz/kabel/sterownik.'},
  a_health:{type:'end',kind:'info',title:'Kondycja baterii',text:'Wygeneruj raport baterii (powercfg /batteryreport) i porównaj pojemność projektową z faktyczną. Zużyta bateria = wymiana. Niektóre laptopy mają limit ładowania (tryb dbania o baterię).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Brak ładowania mimo testu zasilacza — usterka baterii/gniazda/płyty. Zgłoś do serwisu.'},
 }},

/* ============ 31. BSOD ============ */
{id:'bsod',title:'Niebieski ekran (BSOD)',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'System pokazuje błąd krytyczny i restartuje się.',start:'s_code',
 nodes:{
  s_code:{type:'step',title:'Zapisz kod i kontekst',list:['Zanotuj kod błędu (stop code) i nazwę pliku, jeśli podana','Kiedy występuje? po podłączeniu czegoś / w konkretnej aplikacji?','Podgląd zdarzeń → System: szukaj błędów przy crashu','Czy ostatnio była aktualizacja/sterownik/nowy sprzęt?'],next:'q_freq'},
  q_freq:{type:'decision',title:'Jak często?',options:[{label:'Po konkretnej zmianie (sterownik/sprzęt/update)',to:'s_revert'},{label:'Losowo / coraz częściej',to:'s_test'}]},
  s_revert:{type:'step',title:'Cofnij zmianę',list:['Cofnij/zaktualizuj podejrzany sterownik','Odepnij ostatnio dodany sprzęt','Odinstaluj problematyczną aktualizację / przywróć punkt'],next:'q_ok'},
  s_test:{type:'step',title:'Test sprzętu',list:['Test pamięci RAM (mdsched)','Stan dysku (SMART)','Temperatury / zapylenie (przegrzewanie)','sfc /scannow + DISM'],next:'q_ok'},
  q_ok:{type:'decision',title:'BSOD ustąpił?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Brak kolejnych BSOD. Udokumentuj przyczynę (sterownik/RAM/update).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Powtarzające się BSOD mimo diagnozy — eskaluj z kodem błędu i zrzutem (minidump) do serwisu/L2.'},
 }},

/* ============ 32. PRZEGRZEWANIE ============ */
{id:'overheat',title:'Komputer się przegrzewa / głośny wentylator',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Wysokie temperatury, throttling, hałas lub samoczynne wyłączenia.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Diagnoza',list:['Sprawdź obciążenie w Menedżerze zadań — czy jakiś proces grzeje CPU?','Czy otwory wentylacyjne nie są zasłonięte (np. laptop na łóżku)?','Zakurzone wloty/wentylator? (czyszczenie)','Aktualizacje BIOS/sterowników zarządzania energią'],next:'q_ok'},
  q_ok:{type:'decision',title:'Lepiej?',options:[{label:'Tak (proces/kurz/wentylacja)',to:'a_res'},{label:'Nadal gorąco / wyłącza się',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Temperatury w normie. Najczęściej proces w tle, kurz lub zasłonięta wentylacja.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj — serwis',text:'Stałe przegrzewanie lub wyłączenia mimo czyszczenia — wymaga serwisu (pasta termoprzewodząca, wentylator). Zgłoś, by uniknąć uszkodzenia.'},
 }},

/* ============ 33. STACJA DOKUJĄCA ============ */
{id:'dock',title:'Stacja dokująca — monitory/sieć nie działają',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Po podłączeniu do doku gasną monitory, nie ma sieci lub urządzeń.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy doku',list:['Dok zasilany i pewnie wpięty (USB-C/Thunderbolt do końca)?','Test bezpośrednio do laptopa — czy monitor/sieć działają bez doku?','Przełóż kabel monitora do innego portu doku','Restart: odepnij dok, odczekaj, wepnij ponownie'],next:'q_ok'},
  q_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_fw'}]},
  s_fw:{type:'step',title:'Firmware i sterowniki',list:['Zaktualizuj firmware stacji dokującej (narzędzie producenta)','Zaktualizuj sterownik karty graficznej i USB/Thunderbolt','Sprawdź, czy port USB-C laptopa obsługuje obraz/zasilanie (DisplayPort Alt Mode)'],next:'q_fw_ok'},
  q_fw_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Dok działa. Najczęstsza przyczyna: firmware doku lub sterownik GPU.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Mimo firmware i sterowników dok zawodzi — test innego doku / zgłoszenie usterki.'},
 }},

/* ============ 34. KLAWIATURA/MYSZ ============ */
{id:'inputdev',title:'Klawiatura lub mysz nie działa',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Brak reakcji urządzenia wskazującego lub klawiatury.',start:'q_type',
 nodes:{
  q_type:{type:'decision',title:'Jakie urządzenie?',options:[{label:'Przewodowe (USB)',to:'s_wired'},{label:'Bezprzewodowe / Bluetooth',to:'s_wireless'}]},
  s_wired:{type:'step',title:'USB',list:['Przełóż do innego portu USB','Test na innym komputerze (wyklucza urządzenie)','Menedżer urządzeń — sterownik / żółty wykrzyknik','Restart komputera'],next:'q_ok'},
  s_wireless:{type:'step',title:'Bezprzewodowe',list:['Wymień/naładuj baterie','Odbiornik USB w innym porcie / bliżej urządzenia','Bluetooth: usuń parowanie i sparuj ponownie','Włącznik na urządzeniu / przycisk pairing'],next:'q_ok'},
  q_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Urządzenie działa. Najczęściej port/baterie/parowanie.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj / wymiana',text:'Jeśli urządzenie nie działa też na innym komputerze — uszkodzone, wymień.'},
 }},

/* ============ 35. USB ============ */
{id:'usb',title:'Urządzenie USB nie jest wykrywane',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Pendrive, dysk lub urządzenie USB nie pojawia się w systemie.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy USB',list:['Inny port (najlepiej z tyłu / bezpośrednio, nie przez hub)','Test urządzenia na innym komputerze','Menedżer urządzeń — czy widać urządzenie / żółty wykrzyknik?','Dysk: Zarządzanie dyskami — czy widać wolumin bez litery?'],next:'q_ok'},
  q_ok:{type:'decision',title:'Wykrywane?',options:[{label:'Tak (nadać literę/sterownik)',to:'a_res'},{label:'Nie nigdzie',to:'a_dev'},{label:'Tylko na tym komputerze nie',to:'a_drv'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Urządzenie wykryte. Dysk bez litery → nadaj literę w Zarządzaniu dyskami.'},
  a_dev:{type:'end',kind:'info',title:'Uszkodzone urządzenie',text:'Skoro nie działa na żadnym komputerze — uszkodzony nośnik/urządzenie. Jeśli to dysk z danymi, ostrożnie z odzyskiem (nie formatuj).'},
  a_drv:{type:'end',kind:'info',title:'Sterowniki USB komputera',text:'Działa gdzie indziej, ale nie tu — przeinstaluj kontrolery USB (Menedżer urządzeń), zaktualizuj chipset/BIOS. Sprawdź też polityki blokady USB (DLP/Intune).'},
 }},

/* ============ 36. DŹWIĘK ============ */
{id:'sound',title:'Dźwięk nie działa (głośniki/słuchawki)',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Brak dźwięku w całym systemie, nie tylko w jednej aplikacji.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy dźwięku',list:['Głośność i wyciszenie (system + mikser aplikacji)','Właściwe urządzenie wyjściowe wybrane (ikona głośnika → urządzenia)','Słuchawki/głośnik dobrze wpięte; Bluetooth połączony i wybrany','Uruchom narzędzie do rozwiązywania problemów z dźwiękiem'],next:'q_ok'},
  q_ok:{type:'decision',title:'Jest dźwięk?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'s_drv'}]},
  s_drv:{type:'step',title:'Sterownik audio',list:['Menedżer urządzeń → Kontrolery dźwięku → uruchom ponownie/zaktualizuj','Przeinstaluj sterownik audio (producent płyty/laptopa)','Test innego wyjścia (HDMI/słuchawki) — zawęża problem'],next:'q_drv_ok'},
  q_drv_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Dźwięk działa. Najczęściej złe urządzenie wyjściowe lub sterownik.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Brak dźwięku mimo sterownika — możliwa usterka układu audio. Eskaluj do serwisu.'},
 }},

/* ============ 37. BLUETOOTH ============ */
{id:'bluetooth',title:'Bluetooth nie paruje / nie działa',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Nie można sparować lub połączyć urządzenia Bluetooth.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy BT',list:['Bluetooth włączony w Windows i tryb pairing na urządzeniu?','Naładowane / w zasięgu?','Usuń urządzenie i sparuj ponownie','Sprawdź, czy nie jest połączone z innym komputerem/telefonem'],next:'q_ok'},
  q_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Brak Bluetooth w ustawieniach',to:'s_drv'},{label:'Paruje, ale rwie/nie łączy',to:'s_drv'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Połączono. Najczęściej ponowne parowanie / zajęte przez inne urządzenie.'},
  s_drv:{type:'step',title:'Sterownik / adapter',list:['Menedżer urządzeń → Bluetooth → uruchom ponownie/zaktualizuj sterownik','Sprawdź, czy adapter BT nie jest wyłączony (tryb samolotowy, BIOS)','Restart usługi Bluetooth Support Service'],next:'q_drv_ok'},
  q_drv_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Brak BT mimo sterownika — możliwa usterka adaptera. Obejście: odbiornik USB; w razie potrzeby serwis.'},
 }},

/* ============ 38. DYSK PEŁNY ============ */
{id:'diskfull',title:'Dysk się zapełnił (brak miejsca na C:)',cat:'Sprzęt',c:'var(--hw)',icon:'hw',
 desc:'Mało miejsca na dysku systemowym powoduje błędy i spowolnienia.',start:'s_clean',
 nodes:{
  s_clean:{type:'step',title:'Zwolnij miejsce',list:['Oczyszczanie dysku / Czujnik pamięci (Storage Sense) — pliki tymczasowe','Opróżnij Kosz i folder Pobrane','Odinstaluj nieużywane aplikacje','Sprawdź największe foldery (np. profile, stare aktualizacje Windows.old)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Jest miejsce?',options:[{label:'Tak',to:'a_res'},{label:'Nadal pełno / szybko wraca',to:'q_why'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Miejsce zwolnione. Zaproponuj Storage Sense / przeniesienie danych do OneDrive.'},
  q_why:{type:'decision',title:'Co zajmuje miejsce?',options:[{label:'Pliki użytkownika (dane)',to:'a_data'},{label:'Tajemniczo / nieznane',to:'a_esc'}]},
  a_data:{type:'end',kind:'info',title:'Przenieś dane',text:'Dysk za mały na dane usera — przenieś do OneDrive/zasobu sieciowego, włącz Pliki na żądanie (Files On-Demand). Rozważ większy dysk, jeśli to się powtarza.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Miejsce znika bez wyraźnej przyczyny — analiza narzędziem (np. TreeSize), sprawdź logi/wycieki/malware lub eskaluj.'},
 }},

/* ============ 39. WIFI ============ */
{id:'wifi',title:'Wi-Fi nie łączy się',cat:'Sieci',c:'var(--net)',icon:'net',
 desc:'Brak połączenia bezprzewodowego lub połączenie bez internetu.',start:'q_see',
 nodes:{
  q_see:{type:'decision',title:'Co widać?',options:[{label:'Nie widać żadnych sieci',to:'s_adapter'},{label:'Widać sieć, nie łączy / złe hasło',to:'s_connect'},{label:'Łączy, ale brak internetu',to:'a_noinet'}]},
  s_adapter:{type:'step',title:'Karta Wi-Fi',list:['Wyłączony tryb samolotowy? Wi-Fi włączone?','Fizyczny przełącznik/klawisz Fn Wi-Fi','Menedżer urządzeń → karta sieci bezprzewodowej → włącz/zaktualizuj','Restart komputera'],next:'q_ok'},
  s_connect:{type:'step',title:'Połączenie z siecią',list:['Zapomnij sieć i połącz ponownie (poprawne hasło)','Sieć firmowa (WPA2-Enterprise): czy profil/certyfikat aktualny po zmianie hasła?','Sprawdź, czy inni łączą się z tą siecią'],next:'q_ok'},
  q_ok:{type:'decision',title:'Połączono z internetem?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_noinet'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Wi-Fi działa. Najczęściej karta/profil sieci/hasło.'},
  a_noinet:{type:'end',kind:'info',title:'Połączono, brak internetu',text:'To już diagnoza warstw wyżej — przejdź do scenariusza „Brak dostępu do internetu" (IP/DHCP/brama/DNS).'},
 }},

/* ============ 40. VPN ============ */
{id:'vpn',title:'VPN nie łączy / rozłącza się',cat:'Sieci',c:'var(--net)',icon:'net',
 desc:'Problem ze zdalnym połączeniem do sieci firmowej.',start:'q_net',
 nodes:{
  q_net:{type:'decision',title:'Czy działa zwykły internet?',text:'Bez VPN — strony się ładują?',options:[{label:'Tak, internet działa',to:'q_sym'},{label:'Nie',to:'a_inet'}]},
  a_inet:{type:'end',kind:'info',title:'Najpierw napraw internet',text:'VPN nie połączy się bez działającego internetu. Przejdź do scenariusza „Brak dostępu do internetu".'},
  q_sym:{type:'decision',title:'Na czym polega problem?',options:[{label:'Nie łączy / błąd uwierzytelniania',to:'s_auth'},{label:'Łączy, ale brak dostępu do zasobów',to:'a_routes'},{label:'Rozłącza się',to:'a_drop'}]},
  s_auth:{type:'step',title:'Logowanie do VPN',list:['Poprawne dane + MFA (jeśli wymagane)','Po zmianie hasła zaktualizuj je w kliencie VPN','Sprawdź ważność certyfikatu klienta','Zaktualizuj/przeinstaluj klienta VPN'],next:'q_auth_ok'},
  q_auth_ok:{type:'decision',title:'Łączy?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_routes:{type:'end',kind:'info',title:'Połączono, brak zasobów',text:'Tunel działa, ale brak dostępu — sprawdź czy łapie firmowy DNS, split-tunneling i czy user ma uprawnienia do zasobu. Często to konfiguracja po stronie VPN/serwera — eskaluj, jeśli dotyczy wielu.'},
  a_drop:{type:'end',kind:'info',title:'Częste rozłączenia',text:'Sprawdź stabilność łącza usera (Wi-Fi/słaby sygnał), oszczędzanie energii karty sieciowej, MTU. Jeśli rozłącza wszystkich → problem koncentratora VPN, eskaluj.'},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'VPN łączy. Udokumentuj (hasło/certyfikat/klient).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Nie łączy mimo poprawnych danych — eskaluj do administratora VPN z komunikatem błędu.'},
 }},

/* ============ 41. DYSK SIECIOWY ============ */
{id:'mapdrive',title:'Zmapowany dysk sieciowy zniknął',cat:'Sieci',c:'var(--net)',icon:'net',
 desc:'Dysk sieciowy z czerwonym X lub całkowicie nieobecny.',start:'q_who',
 nodes:{
  q_who:{type:'decision',title:'Kogo dotyczy?',options:[{label:'Wszystkich',to:'a_server'},{label:'Tylko tego usera',to:'s_remap'}]},
  a_server:{type:'end',kind:'escalate',title:'Serwer plików',text:'Skoro nikt nie ma dysku — serwer plików lub udział niedostępny. Eskaluj do administratora serwera.'},
  s_remap:{type:'step',title:'Odśwież mapowanie',list:['Kliknij dysk — czasem łączy się po pierwszym dostępie (czerwony X bywa mylący)','Sprawdź ścieżkę: \\\\serwer\\udzial w eksploratorze','Zmapuj ponownie: net use Z: \\\\serwer\\udzial /persistent:yes','Mapuje GPO? gpupdate /force + sprawdź członkostwo w grupie'],next:'q_ok'},
  q_ok:{type:'decision',title:'Dysk dostępny?',options:[{label:'Tak',to:'a_res'},{label:'Brak uprawnień',to:'a_perm'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Dysk przywrócony. Udokumentuj (GPO/mapowanie).'},
  a_perm:{type:'end',kind:'info',title:'Uprawnienia',text:'Jeśli odmowa dostępu — przejdź do scenariusza „Brak dostępu do folderu współdzielonego" (grupy/uprawnienia).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora serwera plików.'},
 }},

/* ============ 42. POCZTA NA TELEFONIE ============ */
{id:'mobilemail',title:'Telefon nie odbiera firmowej poczty',cat:'Mobilność',c:'var(--intune)',icon:'intune',
 desc:'Brak synchronizacji firmowej poczty na urządzeniu mobilnym.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy',list:['Internet na telefonie (Wi-Fi/dane) działa?','Aplikacja Outlook Mobile zalecana zamiast wbudowanej poczty','Wyloguj i zaloguj ponownie kontem służbowym (z MFA)','Po zmianie hasła — zaktualizuj je w aplikacji'],next:'q_ok'},
  q_ok:{type:'decision',title:'Synchronizuje?',options:[{label:'Tak',to:'a_res'},{label:'Błąd zgodności / zablokowane',to:'a_compliance'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Poczta synchronizuje się. Najczęściej ponowne logowanie / hasło.'},
  a_compliance:{type:'end',kind:'info',title:'Zgodność urządzenia / MAM',text:'Conditional Access może wymagać zgodnego urządzenia lub Outlooka z politykami ochrony aplikacji (MAM). Zarejestruj urządzenie / zainstaluj Company Portal i Outlook — patrz scenariusz rejestracji w MDM.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora M365/Intune (polityki dostępu mobilnego).'},
 }},

/* ============ 43. TELEFON MDM ============ */
{id:'mdmenroll',title:'Telefon nie rejestruje się w Intune/MDM',cat:'Mobilność',c:'var(--intune)',icon:'intune',
 desc:'Rejestracja urządzenia w zarządzaniu nie kończy się powodzeniem.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy rejestracji',list:['Internet i zalogowanie kontem służbowym z MFA','Zainstaluj Company Portal (Android/iOS) i postępuj wg kreatora','Sprawdź, czy user ma licencję Intune','Sprawdź limit urządzeń na użytkownika (enrollment limit)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Zarejestrowane?',options:[{label:'Tak',to:'a_res'},{label:'Błąd zgodności / platformy',to:'a_policy'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Urządzenie zarejestrowane. Udokumentuj (licencja/limit).'},
  a_policy:{type:'end',kind:'info',title:'Polityki rejestracji',text:'Sprawdź enrollment restrictions (czy platforma/wersja OS dozwolona) i limit urządzeń. Skoryguj politykę lub zwiększ limit (uprawnienia admina).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora Intune z komunikatem błędu i typem urządzenia.'},
 }},

/* ============ 44. ACTIVATION LOCK ============ */
{id:'activationlock',title:'iPhone — Activation Lock po resecie',cat:'Mobilność',c:'var(--apple)',icon:'apple',
 desc:'Po wymazaniu iPhone żąda obcego Apple ID.',start:'q_supervised',
 nodes:{
  q_supervised:{type:'decision',title:'Czy urządzenie jest firmowe (supervised w ABM)?',options:[{label:'Tak, w Apple Business Manager',to:'s_managed'},{label:'Nie / nie wiem',to:'a_owner'}]},
  s_managed:{type:'step',title:'Zarządzany Activation Lock',list:['W MDM/ABM sprawdź zarządzany kod odblokowania (bypass code)','Wyłącz Activation Lock przez MDM dla tego urządzenia','Wyrejestruj i ponownie przygotuj urządzenie'],next:'q_ok'},
  q_ok:{type:'decision',title:'Odblokowane?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Activation Lock zdjęty przez zarządzanie. Na przyszłość: wyrejestruj urządzenie przed przekazaniem.'},
  a_owner:{type:'end',kind:'info',title:'Potrzebny poprzedni właściciel',text:'Bez supervised/MDM odblokowanie wymaga oryginalnego Apple ID i hasła poprzedniego użytkownika (lub dowodu zakupu w Apple). To zabezpieczenie antykradzieżowe — nie da się go obejść technicznie.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora ABM/MDM — sprawdzenie statusu urządzenia i kodu bypass.'},
 }},

/* ============ 45. NON-COMPLIANT ============ */
{id:'noncompliant',title:'Urządzenie „non-compliant" — utrata dostępu',cat:'Mobilność',c:'var(--intune)',icon:'intune',
 desc:'Conditional Access blokuje dostęp przez niezgodność urządzenia.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Sprawdź warunki zgodności',list:['Intune → urządzenie → które reguły są niespełnione?','Częste: brak szyfrowania (BitLocker), brak PIN/hasła, stara wersja OS, wykryte zagrożenie','Popraw na urządzeniu (np. włącz BitLocker, ustaw PIN, zaktualizuj OS)','Wymuś Sync w Company Portal'],next:'q_ok'},
  q_ok:{type:'decision',title:'Zgodne i ma dostęp?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Urządzenie zgodne, dostęp przywrócony. Udokumentuj, która reguła była niespełniona.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Mimo spełnienia reguł status nie aktualizuje się — wymuś Sync, poczekaj na ocenę; jeśli dalej źle, eskaluj do administratora Intune.'},
 }},

/* ============ 46. APLIKACJA NA TELEFONIE ============ */
{id:'mobileapp',title:'Aplikacja firmowa nie instaluje się na telefonie',cat:'Mobilność',c:'var(--intune)',icon:'intune',
 desc:'Brak firmowej aplikacji lub błąd instalacji na urządzeniu mobilnym.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy',list:['Otwórz Company Portal → zainstaluj/odśwież aplikację','Wymuś Sync urządzenia','Internet i wolne miejsce na telefonie','Sprawdź przypisanie aplikacji do grupy usera/urządzenia (VPP dla iOS)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Zainstalowane?',options:[{label:'Tak',to:'a_res'},{label:'Brak miejsc w licencji (VPP)',to:'a_vpp'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Aplikacja zainstalowana. Udokumentuj (przypisanie/sync).'},
  a_vpp:{type:'end',kind:'info',title:'Brak licencji VPP',text:'iOS przez VPP — może brakować wolnych miejsc licencji aplikacji. Dokup/zwolnij miejsca w Apple Business Manager lub zmień przypisanie na „device-based".'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora Intune (przypisanie, logi instalacji).'},
 }},

/* ============ 47. PHISHING ============ */
{id:'phishing',title:'Podejrzany e-mail / phishing',cat:'Bezpieczeństwo',c:'var(--sec)',icon:'sec',
 desc:'Użytkownik dostał podejrzaną wiadomość lub w nią kliknął.',start:'q_clicked',
 nodes:{
  q_clicked:{type:'decision',title:'Czy user już kliknął/podał dane?',options:[{label:'Nie, tylko zgłasza maila',to:'s_report'},{label:'Tak — kliknął link / podał hasło',to:'s_incident'},{label:'Tak — otworzył załącznik',to:'s_incident'}]},
  s_report:{type:'step',title:'Zgłoś i zabezpiecz',list:['Nie klikać, nie odpowiadać','Zgłoś przez przycisk Report Phishing / do zespołu bezpieczeństwa','Usuń wiadomość; w razie kampanii — admin może ją usunąć u wszystkich','Pochwal usera za zgłoszenie (buduje czujność)'],next:'a_report_res'},
  a_report_res:{type:'end',kind:'resolved',title:'Zgłoszone',text:'Wiadomość zgłoszona i usunięta. Rozważ ostrzeżenie dla innych, jeśli to kampania.'},
  s_incident:{type:'step',title:'Reaguj jak na incydent',list:['Natychmiast zmień hasło konta i wyloguj wszystkie sesje (revoke)','Sprawdź sign-in logs i reguły skrzynki (przekierowania!)','Jeśli załącznik — odłącz komputer od sieci i przeskanuj (Defender)','Zgłoś do zespołu bezpieczeństwa / eskaluj'],next:'a_incident'},
  a_incident:{type:'end',kind:'escalate',title:'Incydent bezpieczeństwa',text:'Potraktuj jako incydent: hasło zmienione, sesje wylogowane, konto/urządzenie sprawdzone. Eskaluj do bezpieczeństwa do dalszego dochodzenia — nie zamykaj samodzielnie.'},
 }},

/* ============ 48. MALWARE ============ */
{id:'malware',title:'Podejrzenie infekcji / malware',cat:'Bezpieczeństwo',c:'var(--sec)',icon:'sec',
 desc:'Objawy złośliwego oprogramowania na komputerze.',start:'q_ransom',
 nodes:{
  q_ransom:{type:'decision',title:'Jakie objawy?',options:[{label:'Zaszyfrowane pliki / żądanie okupu',to:'a_ransom'},{label:'Pop-upy, dziwne procesy, spowolnienie',to:'s_scan'}]},
  a_ransom:{type:'end',kind:'escalate',title:'Ransomware — działaj natychmiast',text:'NATYCHMIAST odłącz komputer od sieci (kabel/Wi-Fi), nie wyłączaj pochopnie, nie płać. Eskaluj do zespołu bezpieczeństwa — to poważny incydent wymagający koordynacji (izolacja, zakres, odtworzenie z kopii).'},
  s_scan:{type:'step',title:'Izoluj i przeskanuj',list:['Odłącz od sieci, by ograniczyć rozprzestrzenianie','Pełne skanowanie Microsoft Defender (i skan offline, jeśli trzeba)','Sprawdź podejrzane procesy/autostart i ostatnio zainstalowane programy','Zmień hasła z czystego urządzenia, jeśli mogły wyciec'],next:'q_clean'},
  q_clean:{type:'decision',title:'Wyczyszczone i pewne?',options:[{label:'Tak, czysto',to:'a_res'},{label:'Niepewne / poważne',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Zagrożenie usunięte. Udokumentuj i zgłoś do bezpieczeństwa dla świadomości; rozważ zmianę haseł.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Przy wątpliwościach co do pełnego usunięcia — eskaluj. Często najpewniejsze jest przeinstalowanie systemu z czystego obrazu.'},
 }},

/* ============ 49. ZGUBIONY SPRZĘT ============ */
{id:'loststolen',title:'Zgubiony lub skradziony laptop/telefon',cat:'Bezpieczeństwo',c:'var(--sec)',icon:'sec',
 desc:'Pilne zabezpieczenie danych na utraconym urządzeniu.',start:'s_act',
 nodes:{
  s_act:{type:'step',title:'Działaj od razu',list:['Zablokuj/wyczyść urządzenie zdalnie z Intune (Lock / Wipe; iPhone: Lost Mode)','Zmień hasło konta usera i wyloguj wszystkie sesje','Cofnij dostęp VPN i do kluczowych systemów','Potwierdź, czy dysk był szyfrowany (BitLocker/FileVault)'],next:'s_report'},
  s_report:{type:'step',title:'Zgłoś i udokumentuj',list:['Zgłoś do zespołu bezpieczeństwa i przełożonego','Kradzież: zgłoszenie na policję wg polityki firmy','Odnotuj numer seryjny i zakres danych na urządzeniu'],next:'a_res'},
  a_res:{type:'end',kind:'resolved',title:'Zabezpieczone',text:'Urządzenie zablokowane/wyczyszczone, dostęp odcięty, sprawa zgłoszona. Szyfrowanie dysku chroni dane, jeśli urządzenie było zaszyfrowane.'},
 }},

/* ============ 50. PRZEJĘTE KONTO ============ */
{id:'compromised',title:'Konto przejęte / podejrzana aktywność',cat:'Bezpieczeństwo',c:'var(--sec)',icon:'sec',
 desc:'Oznaki, że konto użytkownika zostało przejęte.',start:'s_contain',
 nodes:{
  s_contain:{type:'step',title:'Powstrzymaj (containment)',list:['Zablokuj konto i zresetuj hasło','Wyloguj wszystkie aktywne sesje (revoke sign-in sessions)','Wymuś ponowną rejestrację MFA','Sprawdź reguły skrzynki — usuń obce przekierowania/auto-forward'],next:'s_investigate'},
  s_investigate:{type:'step',title:'Zbadaj zakres',list:['Sign-in logs: skąd logowania, jakie IP/kraje','Audit log: co zrobiono (wysłane maile, dodane reguły, dostęp do plików)','Sprawdź, czy nie dodano metod MFA atakującego','Sprawdź inne konta o podobnym wzorcu'],next:'a_esc'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj jako incydent',text:'Po powstrzymaniu eskaluj do zespołu bezpieczeństwa do pełnego dochodzenia i komunikacji. Udokumentuj wszystkie kroki i ustalenia. Nie zamykaj zgłoszenia samodzielnie.'},
 }},

/* ============ 51. OUTLOOK KALENDARZ ============ */
{id:'calendar',title:'Kalendarz / udostępnianie nie działa',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Brak dostępu do cudzego kalendarza lub błędna synchronizacja terminów.',start:'q_sym',
 nodes:{
  q_sym:{type:'decision',title:'Na czym polega problem?',options:[{label:'Nie widzę cudzego kalendarza',to:'s_perm'},{label:'Terminy się nie synchronizują',to:'s_sync'}]},
  s_perm:{type:'step',title:'Uprawnienia kalendarza',list:['Właściciel kalendarza musi udostępnić go i nadać poziom (np. „Może wyświetlać")','Dodaj kalendarz: Outlook → Otwórz kalendarz → z listy adresowej','Sprawdź, czy zaproszenie do udostępnienia zostało zaakceptowane'],next:'q_ok'},
  s_sync:{type:'step',title:'Synchronizacja',list:['Wyślij/Odbierz (F9); sprawdź tryb offline','Sprawdź w OWA — czy tam terminy są poprawne?','Napraw profil Outlooka, jeśli rozjazd tylko w kliencie'],next:'q_ok'},
  q_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Kalendarz działa. Udokumentuj (uprawnienia/synchronizacja).'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora Exchange (uprawnienia/replikacja kalendarza).'},
 }},

/* ============ 52. AUTOODPOWIEDŹ ============ */
{id:'autoreply',title:'Automatyczna odpowiedź (poza biurem) nie działa',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Wiadomość „poza biurem" nie wysyła się lub nie da się jej ustawić.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Sprawdź ustawienie',list:['Outlook → Plik → Odpowiedzi automatyczne; lub w OWA → Ustawienia','Sprawdź zakres dat (czy nie wygasł)','Osobne treści dla wewnątrz i na zewnątrz organizacji','Domyślnie na zewnątrz wysyła tylko raz na nadawcę'],next:'q_ok'},
  q_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie da się ustawić / błąd',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Autoodpowiedź działa. Najczęściej zakres dat lub treść tylko dla wewnętrznych.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Jeśli opcja niedostępna lub zgłasza błąd — sprawdź uprawnienia/skrzynkę lub eskaluj do administratora Exchange.'},
 }},

/* ============ 53. PODPIS EMAIL ============ */
{id:'signature',title:'Podpis e-mail / firmowy nie działa',cat:'Poczta',c:'var(--m365)',icon:'m365',
 desc:'Brak podpisu, zły podpis lub niespójny firmowy szablon.',start:'q_type',
 nodes:{
  q_type:{type:'decision',title:'Jaki to podpis?',options:[{label:'Indywidualny (ustawia user)',to:'s_user'},{label:'Firmowy, dodawany automatycznie',to:'a_transport'}]},
  s_user:{type:'step',title:'Podpis użytkownika',list:['Outlook → Plik → Opcje → Poczta → Podpisy','Ustaw domyślny podpis dla nowych i odpowiedzi','Podpis jest per urządzenie/profil — w OWA ustaw osobno','Sprawdź, czy nie nadpisuje go reguła firmowa'],next:'q_ok'},
  a_transport:{type:'end',kind:'info',title:'Podpis na poziomie organizacji',text:'Firmowy podpis doklejany centralnie (reguła transportu Exchange lub narzędzie do podpisów). Zmiany robi administrator — zwykle nie widać go w wersji roboczej, dokleja się przy wysyłce. Eskaluj prośby o zmianę szablonu.'},
  q_ok:{type:'decision',title:'Podpis działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Podpis ustawiony. Pamiętaj o osobnym ustawieniu w OWA / na telefonie.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora poczty (reguły transportu / narzędzie podpisów).'},
 }},

/* ============ 54. UDOSTĘPNIONY PLIK ============ */
{id:'sharefile',title:'Udostępniony plik — błąd uprawnień',cat:'Microsoft 365',c:'var(--m365)',icon:'m365',
 desc:'Odbiorca nie może otworzyć udostępnionego pliku/linku.',start:'q_who',
 nodes:{
  q_who:{type:'decision',title:'Kto nie ma dostępu?',options:[{label:'Osoba wewnątrz firmy',to:'s_internal'},{label:'Osoba z zewnątrz (gość/klient)',to:'a_external'}]},
  s_internal:{type:'step',title:'Dostęp wewnętrzny',list:['Sprawdź poziom udostępnienia linku (konkretne osoby vs cała firma)','Udostępnij właściwej osobie/grupie z odpowiednim poziomem','Sprawdź, czy odbiorca loguje się właściwym kontem','Plik w OneDrive vs bibliotece zespołu — różne uprawnienia'],next:'q_ok'},
  a_external:{type:'end',kind:'info',title:'Udostępnianie zewnętrzne',text:'Dostęp dla gości zależy od polityki udostępniania zewnętrznego tenanta (może być wyłączone). Sprawdź ustawienia external sharing w SharePoint/OneDrive; zmiana wymaga admina — eskaluj, jeśli zablokowane.'},
  q_ok:{type:'decision',title:'Ma dostęp?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Dostęp do pliku działa. Udokumentuj poziom udostępnienia.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora SharePoint/OneDrive (polityki udostępniania).'},
 }},

/* ============ 55. ODINSTALOWANIE ============ */
{id:'uninstall',title:'Aplikacja nie chce się odinstalować',cat:'Oprogramowanie',c:'var(--win)',icon:'win',
 desc:'Program zostaje mimo prób usunięcia lub zgłasza błąd.',start:'s_std',
 nodes:{
  s_std:{type:'step',title:'Standardowe usuwanie',list:['Ustawienia → Aplikacje → Odinstaluj','Zamknij procesy aplikacji (Menedżer zadań) i ponów','Uruchom dezinstalator producenta, jeśli jest','Restart i ponowna próba'],next:'q_ok'},
  q_ok:{type:'decision',title:'Usunięte?',options:[{label:'Tak',to:'a_res'},{label:'Zarządzana przez Intune',to:'a_intune'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Aplikacja usunięta. Udokumentuj metodę.'},
  a_intune:{type:'end',kind:'info',title:'Aplikacja zarządzana',text:'Jeśli aplikacja jest wdrażana przez Intune jako wymagana, wróci po sync. Usuń ją przez zmianę przypisania w Intune (Uninstall) — lokalne usuwanie nie wystarczy.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Uporczywe pozostałości — eskaluj (narzędzie czyszczące producenta / czyszczenie rejestru wg procedury).'},
 }},

/* ============ 56. NOWY KOMPUTER / AUTOPILOT ============ */
{id:'autopilot',title:'Nowy komputer nie kończy konfiguracji (Autopilot)',cat:'Endpoint',c:'var(--intune)',icon:'intune',
 desc:'Wdrożenie nowego urządzenia przez Autopilot utyka lub kończy się błędem.',start:'s_check',
 nodes:{
  s_check:{type:'step',title:'Podstawy Autopilota',list:['Stabilny internet (najlepiej kabel) podczas wdrożenia','Logowanie kontem służbowym z MFA','Sprawdź ESP (Enrollment Status Page) — na czym utyka','Czy urządzenie ma poprawny profil Autopilot w Intune?'],next:'q_ok'},
  q_ok:{type:'decision',title:'Skończyło?',options:[{label:'Tak',to:'a_res'},{label:'Utyka na aplikacji/zasadzie',to:'a_app'},{label:'Błąd dołączenia (Entra join)',to:'a_join'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Wdrożenie zakończone. Udokumentuj.'},
  a_app:{type:'end',kind:'info',title:'Aplikacja/zasada blokuje ESP',text:'ESP czeka na wymaganą aplikację/zasadę, która zawodzi. Sprawdź przypisania i logi IME; rozważ wyłączenie blokowania na czas diagnozy lub eskaluj do administratora Intune.'},
  a_join:{type:'end',kind:'escalate',title:'Błąd Entra join',text:'Problem z dołączeniem do Entra — sprawdź profil Autopilot, hash urządzenia w Intune i sieć (porty/proxy). Eskaluj do administratora Intune z logiem.'},
 }},

/* ============ 57. WOLNY INTERNET ============ */
{id:'slownet',title:'Wolny internet (niska przepustowość)',cat:'Sieci',c:'var(--net)',icon:'net',
 desc:'Połączenie działa, ale jest powolne lub niestabilne.',start:'q_scope',
 nodes:{
  q_scope:{type:'decision',title:'Kogo dotyczy?',options:[{label:'Wszystkich w biurze',to:'a_mass'},{label:'Tylko tego usera',to:'q_medium'}]},
  a_mass:{type:'end',kind:'escalate',title:'Łącze / sieć firmowa',text:'Spowolnienie u wszystkich — przeciążone łącze ISP, AP lub sieć. Eskaluj do zespołu sieciowego (sprawdzą obciążenie i jakość łącza).'},
  q_medium:{type:'decision',title:'Wi-Fi czy kabel?',options:[{label:'Wi-Fi',to:'s_wifi'},{label:'Kabel',to:'s_wired'}]},
  s_wifi:{type:'step',title:'Diagnoza Wi-Fi',list:['Sprawdź siłę sygnału — bliżej AP jest lepiej?','Pasmo 5 GHz zamiast 2,4 GHz (mniej zakłóceń, szybciej)','Test prędkości na kablu dla porównania','Co pobiera pasmo w tle? (aktualizacje, sync, chmura)'],next:'q_ok'},
  s_wired:{type:'step',title:'Diagnoza kabla',list:['Negocjacja prędkości/duplex portu (show interfaces / sterownik)','Inny kabel/port','Co zużywa pasmo w tle (kopie, sync)?','Test prędkości i porównanie z innym stanowiskiem'],next:'q_ok'},
  q_ok:{type:'decision',title:'Poprawa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Prędkość wróciła. Najczęściej sygnał Wi-Fi, pasmo lub transfer w tle.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Tylko ten user wolno mimo diagnozy — eskaluj do sieciowców (port, okablowanie, profil QoS).'},
 }},

/* ============ 58. USŁUGA FIRMOWA ============ */
{id:'appdown',title:'Nie działa konkretna aplikacja/usługa firmowa',cat:'Oprogramowanie',c:'var(--win)',icon:'win',
 desc:'Konkretny system firmowy (ERP/CRM/intranet) jest niedostępny.',start:'q_scope',
 nodes:{
  q_scope:{type:'decision',title:'Kogo dotyczy?',options:[{label:'Wszystkich',to:'a_service'},{label:'Tylko tego usera',to:'s_user'}]},
  a_service:{type:'end',kind:'escalate',title:'Awaria usługi',text:'Skoro nikt nie ma dostępu — to awaria aplikacji/serwera lub łącza do niej. Sprawdź status usługi i eskaluj do administratora/dostawcy systemu; poinformuj userów.'},
  s_user:{type:'step',title:'Diagnoza po stronie usera',list:['Jaki dokładnie komunikat błędu?','Czy ma dostęp/uprawnienia/licencję do tej aplikacji?','Wyczyść cache / inna przeglądarka / ponowne logowanie','Sprawdź łączność do adresu aplikacji (ping/port)'],next:'q_ok'},
  q_ok:{type:'decision',title:'Działa?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Aplikacja działa. Najczęściej dostęp/cache/logowanie.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj do administratora/dostawcy aplikacji z komunikatem błędu i tym, co sprawdzono.'},
 }},

/* ============ 59. HASŁO ZMIANA ============ */
{id:'pwchange',title:'Użytkownik nie może zmienić hasła',cat:'Tożsamość',c:'var(--ad)',icon:'ad',
 desc:'Zmiana hasła odrzucana lub niemożliwa do wykonania.',start:'q_msg',
 nodes:{
  q_msg:{type:'decision',title:'Jaki komunikat?',options:[{label:'Hasło nie spełnia wymagań',to:'a_policy'},{label:'Za wcześnie / hasło użyte wcześniej',to:'a_age'},{label:'Nie da się otworzyć ekranu zmiany',to:'s_method'}]},
  a_policy:{type:'end',kind:'info',title:'Polityka haseł',text:'Hasło musi spełniać politykę (długość, złożoność, brak nazwy użytkownika). Wyjaśnij wymagania userowi. Zalecaj długą frazę zamiast krótkiej, skomplikowanej.'},
  a_age:{type:'end',kind:'info',title:'Minimalny wiek / historia',text:'Polityka może blokować zbyt częstą zmianę (minimum password age) lub powtórzenie ostatnich haseł (historia). Poczekaj wymagany czas lub admin może wymusić reset.'},
  s_method:{type:'step',title:'Inna metoda zmiany',list:['W domenie: Ctrl+Alt+Del → Zmień hasło','M365: aka.ms/sspr (samodzielny reset/zmiana)','Jeśli zablokowane — reset przez helpdesk po weryfikacji tożsamości'],next:'q_ok'},
  q_ok:{type:'decision',title:'Zmienione?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Hasło zmienione. Przypomnij o aktualizacji tam, gdzie było zapisane.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Eskaluj — sprawdź stan konta (zablokowane do zmiany, problem replikacji) lub przekaż do administratora tożsamości.'},
 }},

/* ============ 60. KONTO WYŁĄCZONE ============ */
{id:'disabled',title:'Konto wyłączone / „zablokowane przez administratora"',cat:'Tożsamość',c:'var(--ad)',icon:'ad',
 desc:'User nie może się zalogować, bo konto jest wyłączone.',start:'q_verify',
 nodes:{
  q_verify:{type:'decision',title:'Zweryfikuj tożsamość i powód',text:'Potwierdź tożsamość, a następnie sprawdź, dlaczego konto jest wyłączone (offboarding? bezpieczeństwo? błąd?).',options:[{label:'Tożsamość OK, to pomyłka/powrót',to:'s_enable'},{label:'Wyłączone celowo (offboarding/bezpieczeństwo)',to:'a_intended'},{label:'Nie mogę potwierdzić tożsamości',to:'a_noverify'}]},
  a_noverify:{type:'end',kind:'escalate',title:'Nie włączaj',text:'Bez weryfikacji tożsamości i znajomości powodu nie włączaj konta — to może być działanie celowe. Eskaluj do bezpieczeństwa/przełożonego.'},
  s_enable:{type:'step',title:'Włącz konto',list:['Sprawdź, czy włączenie jest zatwierdzone (manager/HR)','AD: Enable-ADAccount (lub dsa.msc); Entra: portal → włącz konto','Sprawdź licencję i przynależność do grup po powrocie','W razie potrzeby reset hasła + MFA'],next:'q_ok'},
  q_ok:{type:'decision',title:'Loguje się?',options:[{label:'Tak',to:'a_res'},{label:'Nie',to:'a_esc'}]},
  a_res:{type:'end',kind:'resolved',title:'Rozwiązane',text:'Konto włączone i działa. Udokumentuj kto zatwierdził włączenie.'},
  a_intended:{type:'end',kind:'info',title:'Wyłączone celowo',text:'Jeśli konto wyłączono w ramach offboardingu lub bezpieczeństwa — nie włączaj samodzielnie. Potwierdź z HR/przełożonym/bezpieczeństwem i działaj wg ich decyzji.'},
  a_esc:{type:'end',kind:'escalate',title:'Eskaluj',text:'Konto włączone, ale logowanie nadal nie działa — sprawdź replikację/licencję lub eskaluj do administratora tożsamości.'},
 }},

];
