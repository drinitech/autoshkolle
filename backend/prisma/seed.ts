import { PrismaClient, LicenseCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SKILL_CATEGORIES = [
  'Parkim paralel',
  'Kryqëzim me përparësi',
  'Vozitje autostradë',
  'Manovra paralele',
  'Frenim emergjent',
  'Vozitje në kthesa',
];

type SeedAnswer = { teksti: string; eSakte: boolean };
type SeedQuestion = {
  kategoria: 'SHENJA_RRUGORE' | 'RREGULLA' | 'SIGURIA' | 'PARKIMI' | 'PERPARESIA';
  teksti: string;
  veshtiresia: 'LEHTE' | 'MESATARE' | 'VESHTIRE';
  answers: SeedAnswer[];
};

const DIFFICULTIES = ['LEHTE', 'MESATARE', 'VESHTIRE'];

// Wrong answers are passed flat (not as an array); an optional trailing
// difficulty tag ('LEHTE'/'MESATARE'/'VESHTIRE') is auto-detected and stripped.
function q(
  kategoria: SeedQuestion['kategoria'],
  teksti: string,
  correct: string,
  ...rest: string[]
): SeedQuestion {
  let veshtiresia: SeedQuestion['veshtiresia'] = 'MESATARE';
  let wrong = rest;
  const last = rest[rest.length - 1];
  if (rest.length && DIFFICULTIES.includes(last)) {
    veshtiresia = last as SeedQuestion['veshtiresia'];
    wrong = rest.slice(0, -1);
  }
  return {
    kategoria,
    teksti,
    veshtiresia,
    answers: [{ teksti: correct, eSakte: true }, ...wrong.map((w) => ({ teksti: w, eSakte: false }))],
  };
}

const QUESTIONS: SeedQuestion[] = [
  // ── SHENJA RRUGORE ──────────────────────────────────────
  q('SHENJA_RRUGORE', 'Çfarë tregon një shenjë e rrumbullakët me buzë të kuqe dhe simbol të bardhë brenda?', 'Ndalim ose kufizim', 'Informacion udhëtimi', 'Paralajmërim rreziku', 'Udhëzim detyrues', 'LEHTE'),
  q('SHENJA_RRUGORE', 'Shenja trekëndore me buzë të kuqe tregon zakonisht:', 'Paralajmërim rreziku përpara', 'Ndalim hyrjeje', 'Vend parkimi', 'Fund kufizimi', 'LEHTE'),
  q('SHENJA_RRUGORE', 'Shenja "STOP" detyron drejtuesin të:', 'Ndalojë plotësisht para vijës së ndalimit', 'Ngadalësojë pa u ndalur nëse rruga është e lirë', 'Ndalojë vetëm natën', 'Bjerë borinë para se të vazhdojë', 'LEHTE'),
  q('SHENJA_RRUGORE', 'Shenja blu e rrumbullakët me shigjetë të bardhë tregon:', 'Drejtim të detyrueshëm', 'Zonë parkimi', 'Fund autostrade', 'Kufizim shpejtësie'),
  q('SHENJA_RRUGORE', 'Çfarë do të thotë shenja me numrin "50" brenda rrethit të kuq?', 'Shpejtësia maksimale 50 km/h', 'Shpejtësia minimale 50 km/h', 'Distanca deri te qyteti 50 km', 'Numri i rrugës', 'LEHTE'),
  q('SHENJA_RRUGORE', 'Shenja me vijë diagonale mbi numrin e shpejtësisë tregon:', 'Fundin e kufizimit të shpejtësisë', 'Fillimin e një kufizimi të ri', 'Zonë shkollore', 'Ndalim parakalimi'),
  q('SHENJA_RRUGORE', 'Shenja katrore blu tregon zakonisht:', 'Informacion ose udhëzim (p.sh. zonë e detyrueshme, parkim)', 'Ndalim', 'Rrezik', 'Përparësi'),
  q('SHENJA_RRUGORE', 'Cila shenjë përdoret për të treguar një kalim këmbësorësh?', 'Shenjë trekëndore/katrore me figurë këmbësori', 'Shenjë e rrumbullakët e kuqe pa figurë', 'Shenjë trekëndore me pikëçuditje', 'Shenjë blu me shigjetë'),
  q('SHENJA_RRUGORE', 'Shenja "Rrugë me përparësi" tregon se:', 'Ke përparësi kalimi ndaj rrugëve dytësore që bashkohen', 'Duhet të ndalosh gjithmonë', 'Kufizohet shpejtësia', 'Ndalohet parakalimi'),
  q('SHENJA_RRUGORE', 'Simboli i "biçikletës" brenda një rrethi të kuq me vijë diagonale nënkupton:', 'Ndalohet qarkullimi për biçikleta', 'Rrugë e rezervuar për biçikleta', 'Parkim biçikletash', 'Kujdes, biçikleta në afërsi'),
  q('SHENJA_RRUGORE', 'Shenja trekëndore me figurë "X" të kuqe para një kryqëzimi hekurudhor tregon:', 'Kalim hekurudhor pa barriera', 'Stacion treni', 'Ndalim kalimi përgjithmonë', 'Urë e ngushtë'),
  q('SHENJA_RRUGORE', 'Çfarë do të thotë një shenjë me figurë makine dhe rreth kuq (pa asnjë numër)?', 'Ndalohet hyrja e mjeteve motorike', 'Parkim i lejuar', 'Rrugë me përparësi', 'Zonë industriale'),
  q('SHENJA_RRUGORE', 'Shenja me shigjeta të kryqëzuara (E kuqe) mbi rrugë tregon:', 'Ndalim parakalimi', 'Kryqëzim i rrezikshëm', 'Kalim automjetesh të rënda', 'Vazhdim i drejtë i detyrueshëm'),
  q('SHENJA_RRUGORE', 'Panel plotësues nën një shenjë paralajmëruese zakonisht tregon:', 'Distancën deri te rreziku ose kushte specifike', 'Emrin e qytetit', 'Numrin e rrugës', 'Orarin e funksionimit', 'LEHTE'),
  q('SHENJA_RRUGORE', 'Shenja me figurë "P" të bardhë mbi sfond blu tregon:', 'Zonë parkimi e lejuar', 'Ndalim parkimi', 'Parking rezervë policie', 'Zonë ngarkim-shkarkimi'),
  q('SHENJA_RRUGORE', 'Shenja me vijë të verdhë të ndërprerë në anë të rrugës nënkupton:', 'Ndalim ndalimi (stop) por lejohet ngarkim/shkarkim i shpejtë', 'Ndalim parkimi total', 'Vend rezervuar për taksi', 'Zonë këmbësorësh'),
  q('SHENJA_RRUGORE', 'Cila ngjyrë kufiri karakterizon shenjat e detyrimit (obligim)?', 'Blu, të rrumbullakëta', 'E kuqe, trekëndore', 'E verdhë, katrore', 'E gjelbër, drejtkëndëshe'),
  q('SHENJA_RRUGORE', 'Shenja "Rrugë e ngushtë" paralajmëron se:', 'Rruga ngushtohet përpara, kujdes gjatë kryqëzimit me mjete', 'Rruga mbyllet plotësisht', 'Kufizohet pesha e mjeteve', 'Ndalohet kalimi i biçikletave', 'LEHTE'),
  q('SHENJA_RRUGORE', 'Shenja e "kufizimit të lartësisë" tregohet me:', 'Numër në metra brenda një kornize trekëndore/rrethore', 'Vetëm tekst pa numra', 'Figurë kamioni pa numra', 'Vijë e verdhë horizontale'),
  q('SHENJA_RRUGORE', 'Nëse shenja e kufizimit të shpejtësisë mungon në një zonë banimi, shpejtësia maksimale e zakonshme është:', '30-50 km/h sipas rregullave lokale', '90 km/h', 'Pa kufizim', '110 km/h'),

  // ── RREGULLA (rregulla trafiku) ─────────────────────────
  q('RREGULLA', 'Cila është shpejtësia maksimale e lejuar zakonisht brenda vendbanimit, pa shenjë tjetër?', '50 km/h', '70 km/h', '90 km/h', '30 km/h', 'LEHTE'),
  q('RREGULLA', 'Kur je duke parakaluar, duhet të:', 'Sigurohesh që rruga përpara është e lirë dhe të mos rrezikosh të tjerët', 'Ngasësh sa më shpejt të mundesh pavarësisht kushteve', 'Përdorësh gjithmonë dritat e largëta', 'Bësh sinjal vetëm pas fillimit të manovrës'),
  q('RREGULLA', 'Kur ndriçimi është i pamjaftueshëm, drejtuesi duhet të:', 'Ndezë dritat e pozicionit/të shkurtra', 'Ngasë vetëm me drita paralajmëruese', 'Ndalojë automjetin menjëherë', 'Përdorë vetëm dritat e largëta'),
  q('RREGULLA', 'Ndalohet përdorimi i telefonit celular pa "hands-free" gjatë vozitjes sepse:', 'Ul përqendrimin dhe rrit rrezikun e aksidentit', 'Është i lejuar vetëm natën', 'Është i lejuar në autostradë', 'Ndikon vetëm në bateri', 'LEHTE'),
  q('RREGULLA', 'Distanca e sigurisë mes automjeteve duhet të:', 'Rritet me rritjen e shpejtësisë', 'Mbetet gjithmonë 1 metër', 'Zvogëlohet me shiun', 'Nuk ka rëndësi në qytet'),
  q('RREGULLA', 'Kufiri i alkoolit në gjak për drejtues të rregullt zakonisht është:', '0.2‰–0.5‰ sipas legjislacionit vendor', '1.5‰', '2.0‰', 'Nuk ka kufi'),
  q('RREGULLA', 'Rripi i sigurimit është i detyrueshëm:', 'Për të gjithë udhëtarët, në çdo ulëse', 'Vetëm për shoferin', 'Vetëm jashtë qytetit', 'Vetëm për udhëtarët e vegjël'),
  q('RREGULLA', 'Kur ndodh një aksident me dëmtime materiale të lehta, drejtuesit duhet së pari të:', 'Sigurojnë skenën dhe shkëmbejnë të dhënat', 'Largohen menjëherë nga vendi', 'Thërrasin gjithmonë ambulancën edhe pa lëndime', 'Vazhdojnë udhëtimin normalisht'),
  q('RREGULLA', 'Përdorimi i sinjalizuesve (treguesve të drejtimit) është i detyrueshëm:', 'Para çdo ndryshimi drejtimi ose korsie', 'Vetëm në autostradë', 'Vetëm natën', 'Vetëm kur ka polic në afërsi', 'LEHTE'),
  q('RREGULLA', 'Në rrugë me dy korsi për të njëjtin drejtim, korsia e majtë zakonisht përdoret për:', 'Parakalim, jo për vozitje të vazhdueshme', 'Vozitje të vazhdueshme normale', 'Automjete të rënda', 'Parkim të përkohshëm'),
  q('RREGULLA', 'Ç\'të bësh kur afrohesh te një ambulancë me sirenë të ndezur pas teje?', 'Lëvize djathtas dhe lëshoje kalimin nëse është e sigurt', 'Përshpejtosh për t\'i lënë vend më vonë', 'Ndalosh menjëherë kudo që të jesh', 'Vazhdosh normalisht pa reaguar'),
  q('RREGULLA', 'Mjetet e rënda (kamionë) kanë zakonisht kufizim shpejtësie:', 'Më të ulët se automjetet e lehta', 'Të njëjtë me motoçikletat', 'Më të lartë se automjetet e lehta', 'Pa kufizim në autostradë'),
  q('RREGULLA', 'Kur je në një rreth qarkullimi (rondo), përparësi ka:', 'Automjeti që tashmë është brenda rrethit', 'Automjeti që po hyn', 'Automjeti më i shpejtë', 'Automjeti më i madh'),
  q('RREGULLA', 'Ndalimi i motorit gjatë pritjeve të gjata rekomandohet për:', 'Të reduktuar ndotjen dhe konsumin', 'Të mbajtur klimën gjithmonë ndezur', 'Të rritur shpejtësinë e nisjes', 'Të parandaluar vjedhjen'),
  q('RREGULLA', 'Në kushte të dëborës apo akullit, distanca e frenimit:', 'Rritet ndjeshëm dhe duhet ngadalësuar', 'Mbetet e njëjtë', 'Zvogëlohet', 'Bëhet e parëndësishme me ABS'),
  q('RREGULLA', 'Cila është rregulla për transportimin e fëmijëve nën një moshë/lartësi të caktuar?', 'Përdorimi i sediljes së posaçme (car seat) është i detyrueshëm', 'Mund të mbahen në prehër', 'Duhet të ulen përpara gjithmonë', 'Nuk ka rregulla specifike'),
  q('RREGULLA', 'Kur drita e trafikut është e verdhë vezulluese, kjo do të thotë:', 'Kalo me kujdes të shtuar, ngadalëso', 'Ndalo detyrimisht', 'Ka përparësi absolute', 'Semafori është jashtë funksionit dhe s\'duhet vëmendje'),
  q('RREGULLA', 'Në rast defekti të automjetit në autostradë, drejtuesi duhet të:', 'Vendosë trekëndëshin paralajmërues dhe veshë jelekun reflektues', 'Qëndrojë brenda automjetit gjithmonë', 'Braktisë menjëherë automjetin pa masa', 'Vazhdojë ngadalë deri në destinacion'),
  q('RREGULLA', 'Përdorimi i dritave të largëta (fenerëve të fortë) ndalohet:', 'Kur vjen automjet nga ana e kundërt', 'Vetëm jashtë qytetit', 'Kurrë, mund të përdoren gjithmonë', 'Vetëm gjatë ditës'),
  q('RREGULLA', 'Ndalohet ndalja/parkimi i automjetit:', 'Në kalimin e këmbësorëve', 'Në parkingjet publike', 'Larg kryqëzimeve', 'Në rrugë të gjera', 'LEHTE'),

  // ── SIGURIA ──────────────────────────────────────────────
  q('SIGURIA', 'Cili është qëllimi kryesor i sistemit ABS?', 'Parandalon bllokimin e rrotave gjatë frenimit', 'Rrit shpejtësinë maksimale', 'Ul konsumin e karburantit', 'Ndriçon rrugën më mirë', 'LEHTE'),
  q('SIGURIA', 'Para nisjes së udhëtimit, kontrolli i presionit të gomave është i rëndësishëm sepse:', 'Ndikon në qëndrueshmërinë dhe distancën e frenimit', 'Ndikon vetëm në pamjen e automjetit', 'Nuk ka lidhje me sigurinë', 'Ndikon vetëm në ngjyrën e gomave'),
  q('SIGURIA', 'Jelek reflektues duhet veshur kur:', 'Del nga automjeti i ndaluar në rrugë natën ose me dukshmëri të ulët', 'Vozit brenda qytetit gjatë ditës', 'Është pasagjer i pasëm', 'Vetëm gjatë verës'),
  q('SIGURIA', 'Sistemi ESP (kontrolli elektronik i qëndrueshmërisë) ndihmon kryesisht në:', 'Parandalimin e rrëshqitjes anësore të automjetit', 'Rritjen e fuqisë së motorit', 'Uljen e zhurmës së motorit', 'Kursimin e karburantit'),
  q('SIGURIA', 'Airbag-u funksionon më efektivisht kur:', 'Rripi i sigurimit është i lidhur', 'Rripi i sigurimit nuk përdoret', 'Sedilja është shumë afër timonit', 'Dritaret janë të hapura'),
  q('SIGURIA', 'Pika e verbër (blind spot) i referohet:', 'Zonës që s\'shihet as në pasqyra as direkt', 'Xhamit të përparmë', 'Dritës së pasme', 'Panelit të instrumenteve'),
  q('SIGURIA', 'Lodhja gjatë vozitjes rrit rrezikun sepse:', 'Ngadalëson reflekset dhe kohën e reagimit', 'Nuk ka efekt te drejtuesit me përvojë', 'Përmirëson përqendrimin', 'Ndikon vetëm natën'),
  q('SIGURIA', 'Trekëndëshi paralajmërues vendoset në distancë prej:', 'Rreth 50-100m nga automjeti, sipas llojit të rrugës', 'Ngjitur me automjetin', '5 metra', '500 metra', 'LEHTE'),
  q('SIGURIA', 'Kontrolli i frenave para një udhëtimi të gjatë është i rëndësishëm sepse:', 'Frena me defekt rrisin ndjeshëm rrezikun e aksidentit', 'S\'ka nevojë nëse automjeti është i ri', 'Vetëm garazhi duhet ta kontrollojë vjetor', 'Nuk ndikon në siguri'),
  q('SIGURIA', 'Vozitja në gjendje të dehur ndikon në:', 'Kohën e reagimit, gjykim dhe koordinim', 'Vetëm në aftësinë për të parkuar', 'Asgjë nëse distanca është e shkurtër', 'Vetëm te drejtuesit e rinj'),
  q('SIGURIA', 'Rripi i sigurimit duhet të kalojë:', 'Mbi supin dhe kërdishëll, jo nën krah', 'Vetëm mbi bark', 'Vetëm mbi supin', 'Mund të lihet i lirshëm'),
  q('SIGURIA', 'Nën ndikimin e ilaçeve që shkaktojnë përgjumje, drejtuesi duhet:', 'Të mos vozitë derisa efekti të kalojë', 'Të vozitë ngadalë', 'Të hapë dritaret dhe të vozitë normalisht', 'Të pijë kafe dhe të vazhdojë'),
  q('SIGURIA', 'Në rast zjarri të motorit, hapi i parë duhet të jetë:', 'Ndalja e sigurt e automjetit dhe fikja e motorit', 'Vazhdimi deri te stacioni më i afërt', 'Hapja e kapakut menjëherë', 'Thirrja e policisë para se të ndalosh'),
  q('SIGURIA', 'Distanca e ndalimit (frenimit total) përfshin:', 'Distancën e reagimit plus distancën e frenimit fizik', 'Vetëm distancën e frenimit fizik', 'Vetëm kohën e reagimit', 'Gjatësinë e automjetit'),
  q('SIGURIA', 'Pasqyrat anësore dhe të brendshme duhet të rregullohen:', 'Para nisjes së udhëtimit', 'Vetëm një herë në vit', 'Gjatë vozitjes nëse duket e nevojshme', 'Nuk kanë rëndësi të veçantë'),
  q('SIGURIA', 'Sistemi i frenimit emergjent automatik (AEB) shërben për:', 'Të frenuar automatikisht nëse zbulon rrezik përplasjeje', 'Të parkuar automjetin vetë', 'Të rritur shpejtësinë maksimale', 'Të ndriçuar rrugën më mirë'),
  q('SIGURIA', 'Fëmijët nën një moshë të caktuar rekomandohet të udhëtojnë:', 'Në sediljen e pasme me sistem sigurie të përshtatshëm', 'Në sediljen e përparme gjithmonë', 'Në prehrin e prindit', 'Pa asnjë kufizim vendi'),
  q('SIGURIA', 'Gjatë vozitjes me shi të dendur, rekomandohet:', 'Ulja e shpejtësisë dhe rritja e distancës së sigurisë', 'Rritja e shpejtësisë për të kaluar më shpejt', 'Ndezja e dritave të largëta', 'Fikja e fshirëseve'),
  q('SIGURIA', 'Sistemi i monitorimit të presionit të gomave (TPMS) paralajmëron për:', 'Presion jonormal në goma', 'Nivel të ulët të karburantit', 'Temperaturën e jashtme', 'Distancën e mbetur deri në destinacion'),
  q('SIGURIA', 'Në rast bllokimi të timonit (direksionit), duhet të:', 'Frenosh me kujdes dhe ndalosh të sigurt', 'Përshpejtosh për të dalë nga situata', 'Lëshosh timonin komplet', 'Fikësh motorin menjëherë në lëvizje'),

  // ── PARKIMI ──────────────────────────────────────────────
  q('PARKIMI', 'Gjatë parkimit paralel, hapi i parë është zakonisht:', 'Të pozicionohesh paralel me automjetin para hapësirës', 'Të futesh direkt mbrapsht pa referencë', 'Të parkosh përballë', 'Të hysh me shpejtësi të lartë'),
  q('PARKIMI', 'Kur parkon në rrugë me pjerrësi (kodrinore), rrotat duhet të kthehen:', 'Drejt buzës së trotuarit ose larg saj, sipas drejtimit të pjerrësisë', 'Gjithmonë drejt', 'Nuk ka rëndësi', 'Vetëm majtas'),
  q('PARKIMI', 'Frena e dorës (parking brake) gjatë parkimit duhet:', 'Të vihet gjithmonë, veçanërisht në pjerrësi', 'Të përdoret vetëm natën', 'Të mos përdoret kurrë me marsh të futur', 'Të përdoret vetëm në autostradë'),
  q('PARKIMI', 'Ndalohet parkimi në distancë të shkurtër nga:', 'Hidranti i zjarrfikësve', 'Dyqanet', 'Parqet publike', 'Ndërtesat e larta'),
  q('PARKIMI', 'Kur parkon në një zonë me kufizim kohor (disk parkimi), duhet të:', 'Shënosh orën e mbërritjes në diskun e parkimit', 'Lësh automjetin pa asnjë shenjë', 'Kthehesh çdo orë për ta lëvizur pak', 'Paguash gjithmonë me para në dorë'),
  q('PARKIMI', 'Në parkim mbrapsht drejt (perpendikular), sinjali kthyes duhet:', 'Aktivizuar para fillimit të manovrës', 'Të mos përdoret fare', 'Aktivizuar vetëm pas hyrjes', 'Të mos ketë rëndësi'),
  q('PARKIMI', 'Kur nuk gjendet vend parkimi, ndalohet të:', 'Parkosh mbi trotuar duke penguar këmbësorët', 'Kërkosh parking në rrugë tjetër', 'Presësh derisa lirohet një vend', 'Përdorësh parking të pagueshëm'),
  q('PARKIMI', 'Vendparkimet e shënuara për persona me aftësi të kufizuar:', 'Përdoren vetëm me leje/kartelë të vlefshme', 'Janë të lira për këdo', 'Përdoren vetëm nga taksitë', 'Nuk kanë kufizim kohor asnjëherë'),
  q('PARKIMI', 'Largësia minimale e parkimit nga një kryqëzim zakonisht është:', 'Disa metra (p.sh. 5m), sipas rregullores lokale', '50 cm', 'Nuk ka kufizim', '1 metër maksimum'),
  q('PARKIMI', 'Gjatë daljes nga vendi i parkimit, drejtuesi duhet:', 'Kontrollojë pasqyrat dhe pikën e verbër para se të lëvizë', 'Lëvizë menjëherë pa kontroll', 'Bjerë borinë dhe të nisë', 'Presë vetëm sinjal nga këmbësorët'),
  q('PARKIMI', 'Në parking me disa kate (garazh), shpejtësia duhet të jetë:', 'E ulët, me kujdes të shtuar për këmbësorë', 'E njëjtë si në rrugë të hapur', 'Sa më e lartë për të kursyer kohë', 'Nuk ka rëndësi brenda garazhit'),
  q('PARKIMI', 'Automjeti i parkuar natën në rrugë pa ndriçim duhet:', 'Të ketë dritat e pozicionit të ndezura nëse kërkohet', 'Të mos ketë asnjë dritë të ndezur', 'Të ketë dritat e largëta ndezur', 'Të bjerë alarmin periodikisht'),
  q('PARKIMI', 'Parkimi mbi një kalim këmbësorësh:', 'Është i ndaluar në çdo rast', 'Lejohet për pak minuta', 'Lejohet natën', 'Lejohet nëse s\'ka këmbësorë'),
  q('PARKIMI', 'Kur dy automjete duan të zënë të njëjtin vend paralel, përparësi zakonisht ka:', 'Ai që fillon manovrën i pari sipas rregullave lokale', 'Automjeti më i madh', 'Automjeti më i shpejtë', 'Nuk ka rregull'),
  q('PARKIMI', 'Parkimi i dyfishtë (në krah të një automjeti tjetër të parkuar):', 'Është i ndaluar sepse pengon qarkullimin', 'Lejohet për pak kohë', 'Lejohet me alarmin e ndezur', 'Lejohet nëse s\'ka trafik'),
  q('PARKIMI', 'Kur largohesh nga automjeti i parkuar, duhet gjithmonë të:', 'Fikësh motorin, mbyllësh dyert dhe aktivizosh frenën e dorës', 'Lësh motorin ndezur', 'Lësh dyert e hapura pak', 'Lësh çelësin te kontakti'),
  q('PARKIMI', 'Në zonat me vijë të verdhë të vazhdueshme buzë trotuarit, parkimi:', 'Është i ndaluar', 'Lejohet gjithmonë', 'Lejohet vetëm të dielave', 'Lejohet vetëm natën'),
  q('PARKIMI', 'Për të parkuar në pjerrësi lart (duke shikuar përpjetë), rrotat kthehen:', 'Larg buzës së trotuarit', 'Drejt buzës së trotuarit', 'Drejt, pa kthim', 'Nuk ka rëndësi'),
  q('PARKIMI', 'Sensori i parkimit (parking sensor) ndihmon kryesisht për të:', 'Zbuluar pengesa afër automjetit gjatë manovrave', 'Matur shpejtësinë', 'Kontrolluar presionin e gomave', 'Ndriçuar zonën e parkimit'),
  q('PARKIMI', 'Nëse vendi i parkimit është shumë i ngushtë, drejtuesi më i mirë duhet të:', 'Kërkojë vend tjetër më të përshtatshëm', 'Detyrojë hyrjen me çdo kusht', 'Parkojë gjysmë mbi trotuar', 'Braktisë automjetin aty ku është'),

  // ── PERPARESIA ────────────────────────────────────────────
  q('PERPARESIA', 'Në kryqëzim pa shenja dhe pa semafor, përparësi ka automjeti:', 'Që vjen nga e djathta', 'Që vjen nga e majta', 'Që lëviz më shpejt', 'Që është më i madh', 'LEHTE'),
  q('PERPARESIA', 'Kur je duke dalë nga një parking apo rrugë private në rrugë kryesore:', 'Ke detyrim t\'u japësh përparësi automjeteve në rrugën kryesore', 'Ke gjithmonë përparësi', 'Përparësia varet nga shpejtësia', 'Nuk ka rëndësi kush vjen i pari'),
  q('PERPARESIA', 'Tramvajet në kryqëzime zakonisht kanë:', 'Përparësi ndaj automjeteve të tjera', 'Përparësi vetëm natën', 'Përparësi vetëm në stacione', 'Asnjë përparësi të veçantë'),
  q('PERPARESIA', 'Kur dy automjete afrohen nga drejtime të kundërta dhe njëri kthehet majtas, përparësi ka:', 'Automjeti që vjen drejt (nuk kthehet)', 'Automjeti që kthehet majtas', 'Automjeti më i shpejtë', 'Sipas rendit të mbërritjes'),
  q('PERPARESIA', 'Në një kryqëzim me shenjën "Jep përparësi" (trekëndësh i përmbysur), duhet të:', 'Ngadalësosh dhe lësh të kalojnë automjetet me përparësi', 'Kalosh pa u ndalur nëse ke shpejtësi të lartë', 'Ndalosh gjithmonë komplet si te STOP', 'Bjerë borinë dhe vazhdosh'),
  q('PERPARESIA', 'Këmbësorët në kalimin e shënuar (zebra) kanë përparësi ndaj:', 'Automjeteve që afrohen te kalimi', 'Vetëm biçikletave', 'Vetëm natën', 'Asnjë automjeti'),
  q('PERPARESIA', 'Automjetet e emergjencës (ambulancë, zjarrfikëse) me sirenë të ndezur kanë:', 'Përparësi ndaj të gjitha automjeteve të tjera', 'Përparësi vetëm në autostradë', 'Përparësi vetëm ditën', 'Përparësi vetëm nëse s\'ka trafik'),
  q('PERPARESIA', 'Në një rrugë të ngushtë me pjerrësi, ku vetëm një automjet kalon njëherazi, përparësi zakonisht ka:', 'Automjeti që po ngjitet (varet nga rregullat lokale)', 'Automjeti më i shpejtë', 'Automjeti më i madh gjithmonë', 'Automjeti që zbret gjithmonë pa përjashtim'),
  q('PERPARESIA', 'Kur semafori tregon dritë jeshile por kryqëzimi është i mbushur me automjete, duhet të:', 'Presësh dhe mos hysh derisa të lirohet dalja', 'Hysh gjithsesi sepse ke dritën jeshile', 'Bjerë borinë për të hapur rrugë', 'Kthehesh menjëherë mbrapsht'),
  q('PERPARESIA', 'Në kryqëzim me rreth qarkullimi (rondo) pa shenja shtesë, përparësi zakonisht ka:', 'Automjeti brenda rrethit', 'Automjeti që po hyn nga jashtë', 'Automjeti më i shpejtë', 'Askush, hyjnë njëkohësisht'),
  q('PERPARESIA', 'Biçiklistët në korsi të dedikuar që kryqëzohet me rrugën tënde kanë:', 'Përparësi sipas shenjave të korsisë së biçikletave', 'Kurrë përparësi', 'Përparësi vetëm natën', 'Përparësi vetëm në qytet'),
  q('PERPARESIA', 'Kur një automjet zbret nga një rrugë private ose oborr në trotuar/rrugë, ai duhet:', 'T\'u japë përparësi këmbësorëve dhe automjeteve në rrugë', 'Të ketë përparësi absolute', 'Të bjerë borinë dhe të kalojë', 'Të mos kontrollojë fare, s\'ka rrezik'),
  q('PERPARESIA', 'Në mungesë të shenjave, në një kryqëzim katërshe të barabartë, rregulli bazë është:', 'Përparësia e së djathtës', 'Përparësia e së majtës', 'Kush mbërrin i fundit', 'Kush ka dritat e ndezura'),
  q('PERPARESIA', 'Automjetet e transportit publik (autobusët) që dalin nga stacioni kanë shpesh:', 'Përparësi për t\'u rikthyer në trafik, sipas legjislacionit lokal', 'Kurrë përparësi', 'Përparësi vetëm jashtë orëve të pikut', 'Përparësi vetëm natën'),
  q('PERPARESIA', 'Kur po kthehesh djathtas dhe një këmbësor po kalon rrugën ku po kthehesh, duhet të:', 'Ndalosh dhe lësh këmbësorin të kalojë', 'Përshpejtosh për të kaluar para tij', 'Bjerë borinë që të largohet', 'Vazhdosh kthimin normalisht'),
  q('PERPARESIA', 'Sinjali i policit që ngre dorën vertikalisht do të thotë zakonisht:', 'Ndalo, ngjashëm me dritën e kuqe', 'Vazhdo normalisht', 'Kthehu majtas', 'Rrit shpejtësinë'),
  q('PERPARESIA', 'Nëse semafori është jashtë funksionit, kryqëzimi trajtohet:', 'Si kryqëzim pa përparësi të shenjuar (zakonisht përparësi e djathtës)', 'Si zonë ndalimi absolut për të gjithë', 'Sipas gjykimit të lirë të secilit', 'Vetëm këmbësorët kanë përparësi'),
  q('PERPARESIA', 'Kur ktheheni majtas dhe përballë vjen një automjet drejt (pa kthim), duhet të:', 'Prisni derisa automjeti i drejtë të kalojë', 'Ktheheni menjëherë sepse jeni më afër', 'Bini borinë dhe ktheheni', 'Ngadalësoni por vazhdoni kthimin'),
  q('PERPARESIA', 'Automjetet me përparësi (p.sh. konvoi zyrtar/emergjenca) njihen zakonisht nga:', 'Dritat vezulluese dhe/ose sirena', 'Ngjyra e automjetit', 'Numri i targave', 'Shpejtësia e lartë vetëm'),
  q('PERPARESIA', 'Kur bashkohesh në një rrugë kryesore nga një korsi përshpejtimi (autostradë), duhet të:', 'Përshtatësh shpejtësinë dhe kërkosh hapësirë të sigurt për t\'u bashkuar', 'Ndalosh në fund të korsisë së përshpejtimit', 'Hysh menjëherë pa vëzhguar trafikun', 'Presësh që korsia kryesore të zbrazet plotësisht'),
];

async function main() {
  console.log('Duke pastruar databazën ekzistuese...');
  await prisma.quizAttemptAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizAnswer.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.skillRating.deleteMany();
  await prisma.lessonEvaluation.deleteMany();
  await prisma.drivingLesson.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.skillCategory.deleteMany();
  await prisma.student.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.user.deleteMany();

  console.log('Duke krijuar kategoritë e aftësive...');
  const skillCategories = await Promise.all(
    SKILL_CATEGORIES.map((emri, i) => prisma.skillCategory.create({ data: { emri, renditja: i } }))
  );

  console.log(`Duke krijuar ${QUESTIONS.length} pyetje teorie...`);
  for (const question of QUESTIONS) {
    await prisma.quizQuestion.create({
      data: {
        teksti: question.teksti,
        kategoria: question.kategoria,
        veshtiresia: question.veshtiresia,
        answers: { create: question.answers },
      },
    });
  }

  console.log('Duke krijuar përdorues demo...');
  const passwordHash = await bcrypt.hash('Test1234', 10);

  const admin = await prisma.user.create({
    data: { emri: 'Admin Autoshkolla', email: 'admin@autoshkolla.demo', password: passwordHash, role: 'ADMIN' },
  });

  const instructorUser1 = await prisma.user.create({
    data: { emri: 'Astrit Krasniqi', email: 'instruktor1@autoshkolla.demo', password: passwordHash, role: 'INSTRUCTOR' },
  });
  const instructor1 = await prisma.instructor.create({
    data: { userId: instructorUser1.id, specializimi: [LicenseCategory.B] },
  });

  const instructorUser2 = await prisma.user.create({
    data: { emri: 'Fatmire Berisha', email: 'instruktor2@autoshkolla.demo', password: passwordHash, role: 'INSTRUCTOR' },
  });
  const instructor2 = await prisma.instructor.create({
    data: { userId: instructorUser2.id, specializimi: [LicenseCategory.B, LicenseCategory.A] },
  });

  const studentNames = ['Elira Gashi', 'Blerim Hoxha', 'Vjosa Rama', 'Driton Sylaj', 'Anita Krasniqi'];
  const students = [];
  for (const emri of studentNames) {
    const email = emri.toLowerCase().replace(/\s+/g, '.') + '@student.demo';
    const user = await prisma.user.create({
      data: { emri, email, password: passwordHash, role: 'STUDENT' },
    });
    const student = await prisma.student.create({
      data: { userId: user.id, kategoria: LicenseCategory.B, oreKryera: Math.floor(Math.random() * 15) },
    });
    students.push(student);
  }

  console.log('Duke krijuar disponueshmëri instruktorësh...');
  const today = new Date();
  for (let d = 1; d <= 10; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    date.setHours(0, 0, 0, 0);
    for (const [instId, hours] of [
      [instructor1.id, ['09:00', '11:00', '14:00']],
      [instructor2.id, ['10:00', '13:00', '16:00']],
    ] as [string, string[]][]) {
      for (const start of hours) {
        const [h, m] = start.split(':').map(Number);
        const end = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        await prisma.availabilitySlot.create({
          data: { instructorId: instId, data: date, oraFillimit: start, oraMbarimit: end },
        });
      }
    }
  }

  console.log('Duke krijuar disa orë praktike & vlerësime demo...');
  const firstSlot = await prisma.availabilitySlot.findFirst({ where: { instructorId: instructor1.id } });
  if (firstSlot) {
    await prisma.availabilitySlot.update({ where: { id: firstSlot.id }, data: { iZene: true } });
    const lesson = await prisma.drivingLesson.create({
      data: {
        studentId: students[0].id,
        instructorId: instructor1.id,
        slotId: firstSlot.id,
        data: firstSlot.data,
        oraFillimit: firstSlot.oraFillimit,
        oraMbarimit: firstSlot.oraMbarimit,
        statusi: 'PERFUNDUAR',
      },
    });
    const evaluation = await prisma.lessonEvaluation.create({
      data: { drivingLessonId: lesson.id, shenimTekst: 'Progres i mirë, duhet praktikë shtesë te parkimi paralel.' },
    });
    await prisma.skillRating.createMany({
      data: [
        { lessonEvaluationId: evaluation.id, skillCategoryId: skillCategories[0].id, vleresimi: 'MESATARE' },
        { lessonEvaluationId: evaluation.id, skillCategoryId: skillCategories[1].id, vleresimi: 'MIRE' },
      ],
    });
  }

  console.log('Seed u përfundua me sukses.');
  console.log('Kredencialet demo (fjalëkalimi për të gjithë: Test1234):');
  console.log(`  Admin:      ${admin.email}`);
  console.log(`  Instruktor: ${instructorUser1.email}`);
  console.log(`  Student:    ${studentNames[0].toLowerCase().replace(/\s+/g, '.')}@student.demo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
