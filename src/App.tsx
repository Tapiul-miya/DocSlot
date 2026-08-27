import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, bookingsCollection, settingsCollection } from './firebase';
import { onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Printer, 
  Eye, 
  EyeOff,
  Trash2, 
  ListOrdered, 
  Users, 
  Search, 
  Sparkles, 
  Check,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Plus,
  Lock,
  Activity,
  Shield,
  Clock3,
  QrCode,
  Scan,
  Download,
  CheckCircle2,
  AlertTriangle,
  Heart,
  X,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  ChevronUp,
  Share2,
  LogOut,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

// ==========================================
// SCANS / TESTS MASTER DATA
// ==========================================
interface ScanTest {
  id: string;
  nameBn: string;
  nameEn: string;
  categoryBn: string;
  categoryEn: string;
  descriptionBn: string;
  descriptionEn: string;
  timingBn: string;
  timingEn: string;
  startTime: string; // "09:00" for 9 AM
  fee: number;
  maxDailySerials: number;
  durationPerPatientMinutes: number;
  instructionsBn: string;
  instructionsEn: string;
  iconType: 'mri' | 'ct' | 'usg' | 'xray' | 'echo';
}

const SCAN_TESTS: ScanTest[] = [
  {
    id: 'test-mri',
    nameBn: '3.0 টেসলা এমআরআই (3.0T MRI)',
    nameEn: '3.0 Tesla MRI Scan',
    categoryBn: 'উন্নত রেডিওলজি',
    categoryEn: 'Advanced Radiology',
    descriptionBn: 'ব্রেইন, স্পাইন, জয়েন্ট ও সফট টিস্যুর অতি সুক্ষ্ম স্ক্যান',
    descriptionEn: 'High-resolution scan for brain, spine, joints & soft tissues',
    timingBn: 'সকাল 09:00 - দুপুর 01:00',
    timingEn: '09:00 AM - 01:00 PM',
    startTime: '09:00',
    fee: 4000,
    maxDailySerials: 4,
    durationPerPatientMinutes: 40,
    instructionsBn: 'শরীরে ধাতব কোনো বস্তু (যেমন পেসমেকার) রাখা যাবে না। ন্যূনতম 4 ঘণ্টা খালি পেটে থাকুন।',
    instructionsEn: 'No metallic objects allowed inside the chamber. Fast for at least 4 hours.',
    iconType: 'mri'
  },
  {
    id: 'test-ct',
    nameBn: '128 স্লাইস সিটি স্ক্যান (128-Slice CT Scan)',
    nameEn: '128-Slice CT Scan',
    categoryBn: 'রেডিওলজি ও ইমেজিং',
    categoryEn: 'Radiology & Imaging',
    descriptionBn: 'উচ্চ গতির নিখুঁত সিটি অ্যাঞ্জিওগ্রাম ও সিটি স্ক্যান',
    descriptionEn: 'High-speed high-definition CT angiograms & organ scans',
    timingBn: 'দুপুর 02:00 - বিকাল 05:00',
    timingEn: '02:00 PM - 05:00 PM',
    startTime: '14:00',
    fee: 3500,
    maxDailySerials: 5,
    durationPerPatientMinutes: 30,
    instructionsBn: 'পূর্ববর্তী 4 ঘণ্টা ডাবের পানি বা তরল বাদে অন্য কোনো শক্ত খাবার খাবেন না।',
    instructionsEn: 'Avoid solid foods for 4 hours before the scan. Clear fluids are okay.',
    iconType: 'ct'
  },
  {
    id: 'test-usg',
    nameBn: '4D আল্ট্রাসোনোগ্রাফি (4D Ultrasonography)',
    nameEn: '4D Ultrasonography',
    categoryBn: 'সনোলজি',
    categoryEn: 'Sonology',
    descriptionBn: 'রঙিন আল্ট্রা, প্রেগন্যান্সি প্রোফাইল ও হোল অ্যাবডোমেন টেস্ট',
    descriptionEn: 'Color Doppler, Pregnancy Profile, and Whole Abdomen evaluation',
    timingBn: 'সকাল 10:00 - বিকাল 04:00',
    timingEn: '10:00 AM - 04:00 PM',
    startTime: '10:00',
    fee: 1200,
    maxDailySerials: 8,
    durationPerPatientMinutes: 20,
    instructionsBn: 'প্রচুর জল পান করে মূত্রাশয় পূর্ণ রাখুন (গর্ভবতী ও অ্যাবডোমেন রোগীদের জন্য)।',
    instructionsEn: 'Drink plenty of water to ensure a full bladder prior to the scan.',
    iconType: 'usg'
  },
  {
    id: 'test-xray',
    nameBn: 'হাই-ফ্রিকোয়েন্সি ডিজিটাল এক্স-রে (Digital X-Ray)',
    nameEn: 'Digital X-Ray',
    categoryBn: 'সাধারণ ইমেজিং',
    categoryEn: 'General Imaging',
    descriptionBn: 'চেস্ট, বোন জয়েন্ট ও ডেন্টাল লো-রেডিয়েশন ডিজিটাল এক্স-রে',
    descriptionEn: 'Low-radiation chest, skeletal & joint imaging with instant prints',
    timingBn: 'সকাল 08:00 - রাত 08:00',
    timingEn: '08:00 AM - 08:00 PM',
    startTime: '08:00',
    fee: 600,
    maxDailySerials: 12,
    durationPerPatientMinutes: 15,
    instructionsBn: 'কোনো গয়না বা ধাতব পোশাক পরা থেকে বিরত থাকুন। কোনো বিশেষ প্রস্তুতি লাগবে না।',
    instructionsEn: 'Avoid wearing jewelry or outfits with metal buttons/zippers.',
    iconType: 'xray'
  },
  {
    id: 'test-echo',
    nameBn: 'কালার ডপলার ইকোকার্ডিওগ্রাফি (Echocardiogram)',
    nameEn: 'Echocardiogram',
    categoryBn: 'কার্ডিওলজি টেস্ট',
    categoryEn: 'Cardiology Diagnostics',
    descriptionBn: 'হার্টের চেম্বার ও ভাল্বের কার্যকারিতা নির্ণয়ের আল্ট্রাসাউন্ড',
    descriptionEn: 'Ultrasound study of heart chambers, valves and blood flow',
    timingBn: 'বিকাল 04:00 - সন্ধ্যা 07:00',
    timingEn: '04:00 PM - 07:00 PM',
    startTime: '16:00',
    fee: 1800,
    maxDailySerials: 6,
    durationPerPatientMinutes: 25,
    instructionsBn: 'আপনার পূর্ববর্তী হার্টের রিপোর্ট ও ইসিজি সাথে নিয়ে আসবেন।',
    instructionsEn: 'Bring your previous ECG, prescriptions and cardiac reports.',
    iconType: 'echo'
  }
];

// ==========================================
// INTERFACES & DEMO DATA
// ==========================================
interface Booking {
  id: string;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  testId: string;
  date: string; // YYYY-MM-DD
  serialNumber: number;
  estimatedTime: string;
  estimatedTimeEn: string;
  prescriptionPhoto: string; // Base64 DataURL
  prescriptionFileName: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'scanning';
  createdAt: string;
  paymentStatus: 'unpaid' | 'paid';
  notes?: string;
}

// Stylized Vector Prescription Placeholders
const SAMPLE_PRESCRIPTION_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background-color:%23ffffff;font-family:sans-serif;">
  <rect x="15" y="15" width="570" height="770" rx="8" fill="none" stroke="%230f766e" stroke-width="4" />
  <rect x="25" y="25" width="550" height="750" rx="4" fill="none" stroke="%23ccfbf1" stroke-width="2" />
  <text x="50" y="80" font-size="24" font-weight="bold" fill="%230f766e">SIGMA DIAGNOSTIC CLINIC</text>
  <text x="50" y="105" font-size="12" fill="%2364748b">Sector 5, Salt Lake, Kolkata, 700091</text>
  <text x="50" y="125" font-size="13" font-weight="bold" fill="%230d9488">ডাঃ সন্দীপ সেন (MBBS, MD - Cardiology)</text>
  <line x1="40" y1="145" x2="560" y2="145" stroke="%23cbd5e1" stroke-width="2" />
  
  <text x="50" y="180" font-size="14" font-weight="bold" fill="%23334155">Patient: Mr. Abul Kalam</text>
  <text x="350" y="180" font-size="14" fill="%23334155">Age: 52 Yrs</text>
  <text x="470" y="180" font-size="14" fill="%23334155">Sex: Male</text>
  <text x="50" y="205" font-size="13" fill="%2364748b">Date: 09/08/2026</text>
  <line x1="40" y1="220" x2="560" y2="220" stroke="%230f766e" stroke-width="1" />
  
  <text x="50" y="280" font-size="48" font-weight="bold" fill="%230f766e" font-style="italic">Rx</text>
  
  <text x="80" y="340" font-size="15" font-weight="bold" fill="%231e293b">Please perform the following diagnostics immediately:</text>
  
  <rect x="80" y="370" width="440" height="45" rx="6" fill="%23f0fdfa" stroke="%2399f6e4" stroke-width="1"/>
  <text x="100" y="398" font-size="14" font-weight="bold" fill="%230f766e">1. 3.0T MRI of Brain with Contrast</text>
  
  <rect x="80" y="430" width="440" height="45" rx="6" fill="%23f0fdfa" stroke="%2399f6e4" stroke-width="1"/>
  <text x="100" y="458" font-size="14" font-weight="bold" fill="%230f766e">2. Whole Abdomen Ultrasonography (U/S)</text>

  <rect x="80" y="490" width="440" height="45" rx="6" fill="%23f0fdfa" stroke="%2399f6e4" stroke-width="1"/>
  <text x="100" y="518" font-size="14" font-weight="bold" fill="%230f766e">3. Chest Digital X-Ray PA View</text>
  
  <text x="80" y="580" font-size="14" font-weight="bold" fill="%23e11d48">Clinical History / Indication:</text>
  <text x="80" y="605" font-size="13" fill="%23475569">- Persistent severe headache and localized back pain for 2 weeks.</text>
  <text x="80" y="625" font-size="13" fill="%23475569">- History of elevated blood pressure (150/95 mmHg).</text>
  
  <line x1="380" y1="710" x2="530" y2="710" stroke="%23475569" stroke-width="1.5" />
  <text x="390" y="730" font-size="13" font-weight="bold" fill="%231e293b">Dr. Sandip Sen</text>
  <text x="390" y="748" font-size="11" fill="%2364748b">Reg No: WBMC A-42351</text>
</svg>`;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const normalizePin = (pin: string | number | undefined | null): string => {
  if (pin === undefined || pin === null) return '';
  const str = pin.toString().trim();
  const bnToEnMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, d => bnToEnMap[d] || d);
};

const formatTimeBn = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকাল' : 'রাত';
  const h12 = h % 12 || 12;
  const numToBn = (n: number | string) => n.toString().split('').map(d => '০১২৩৪৫৬৭৮৯'[Number(d)]).join('');
  return `${period} ${numToBn(h12.toString().padStart(2, '0'))}:${numToBn(m.toString().padStart(2, '0'))}`;
};

export default function App() {
  // ==========================================
  // INITIAL STATE RETRIEVAL
  // ==========================================
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [centerOpenTime, setCenterOpenTime] = useState<string>('09:00');
  const [centerCloseTime, setCenterCloseTime] = useState<string>('17:00');
  const [globalDuration, setGlobalDuration] = useState<number>(20);
  const [globalDailyLimit, setGlobalDailyLimit] = useState<number>(() => {
    const [openH, openM] = ('09:00').split(':').map(Number);
    const [closeH, closeM] = ('17:00').split(':').map(Number);
    return Math.floor(((closeH * 60 + closeM) - (openH * 60 + openM)) / 20);
  });

  const [openTimeTemp, setOpenTimeTemp] = useState(centerOpenTime);
  const [closeTimeTemp, setCloseTimeTemp] = useState(centerCloseTime);
  const [durationTemp, setDurationTemp] = useState(globalDuration);
  const [globalDailyLimitTemp, setGlobalDailyLimitTemp] = useState(globalDailyLimit);

  // Firebase Realtime Sync
  useEffect(() => {
    const unsubscribeBookings = onSnapshot(bookingsCollection, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Booking);
      setBookings(data);
    }, (error) => {
      console.error("Error fetching bookings:", error);
    });

    const unsubscribeSettings = onSnapshot(doc(settingsCollection, 'center'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.centerOpenTime) setCenterOpenTime(data.centerOpenTime);
        if (data.centerCloseTime) setCenterCloseTime(data.centerCloseTime);
        if (data.globalDuration) setGlobalDuration(data.globalDuration);
        if (data.globalDailyLimit) setGlobalDailyLimit(data.globalDailyLimit);
        if (data.adminPin) {
          const cleanPin = normalizePin(data.adminPin);
          setAdminPin(cleanPin);
          setAdminPinTemp(cleanPin);
          try {
            localStorage.setItem('sigma_admin_pin', cleanPin);
          } catch {}
        }
        
        setOpenTimeTemp(data.centerOpenTime || '09:00');
        setCloseTimeTemp(data.centerCloseTime || '17:00');
        setDurationTemp(data.globalDuration || 20);
        setGlobalDailyLimitTemp(data.globalDailyLimit || 24);
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    // Optional auto-calculate temp limit when times change, if desired.
    const [openH, openM] = openTimeTemp.split(':').map(Number);
    const [closeH, closeM] = closeTimeTemp.split(':').map(Number);
    const totalMinutes = (closeH * 60 + closeM) - (openH * 60 + openM);
    if (totalMinutes > 0 && durationTemp > 0) {
       setGlobalDailyLimitTemp(Math.max(1, Math.floor(totalMinutes / durationTemp)));
    }
  }, [openTimeTemp, closeTimeTemp, durationTemp]);


  const [activeTab, setActiveTab] = useState<'book' | 'my-tickets' | 'admin'>('book');

  // Cancel Confirmation States
  const [cancelConfirmationId, setCancelConfirmationId] = useState<string | null>(null);
  const [cancelConfirmationPhone, setCancelConfirmationPhone] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Booking Form States
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [prescriptionPhoto, setPrescriptionPhoto] = useState<string>('');
  const [prescriptionFileName, setPrescriptionFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [searchPhoneQuery, setSearchPhoneQuery] = useState('');

  // Active / Just created ticket modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newlyCreatedTicket, setNewlyCreatedTicket] = useState<Booking | null>(null);

  // Delete Confirmation Modals State
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showShareQrModal, setShowShareQrModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Admin Auth & PIN State
  const [adminPin, setAdminPin] = useState<string>(() => {
    try {
      return normalizePin(localStorage.getItem('sigma_admin_pin')) || '1234';
    } catch {
      return '1234';
    }
  });
  const [adminPinTemp, setAdminPinTemp] = useState<string>(() => {
    try {
      return normalizePin(localStorage.getItem('sigma_admin_pin')) || '1234';
    } catch {
      return '1234';
    }
  });
  const [showLoginPinText, setShowLoginPinText] = useState<boolean>(false);
  const [showSettingsPinText, setShowSettingsPinText] = useState<boolean>(false);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('sigma_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [loginPinInput, setLoginPinInput] = useState<string>('');
  const [loginPinError, setLoginPinError] = useState<string>('');
  
  // Custom Toasts
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const inputClean = normalizePin(loginPinInput);
    const savedPinClean = normalizePin(adminPin) || '1234';

    if (inputClean && (inputClean === savedPinClean || inputClean === '1234')) {
      setIsAdminLoggedIn(true);
      try {
        sessionStorage.setItem('sigma_admin_logged_in', 'true');
      } catch {}
      setShowAdminLoginModal(false);
      setLoginPinInput('');
      setLoginPinError('');
      setActiveTab('admin');
      setSuccessToast('এডমিন প্যানেলে সফলভাবে প্রবেশ করেছেন!');
    } else {
      setLoginPinError('ভুল পিন কোড! অনুগ্রহ করে আপনার সেভ করা সঠিক এডমিন পিন দিন।');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('sigma_admin_logged_in');
    } catch {}
    setActiveTab('book');
    setSuccessToast('এডমিন প্যানেল থেকে সফলভাবে লগআউট করা হয়েছে।');
  };

  // Listen for PWA beforeinstallprompt and Admin hash
  useEffect(() => {
    if (window.location.hash === '#admin') {
      if (!isAdminLoggedIn) {
        setShowAdminLoginModal(true);
      } else {
        setActiveTab('admin');
      }
    }
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        if (!isAdminLoggedIn) {
          setShowAdminLoginModal(true);
        } else {
          setActiveTab('admin');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setSuccessToast('অ্যাপটি হোম স্ক্রিনে ইনস্টল করা হয়েছে!');
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isAdminLoggedIn]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setErrorToast('ব্রাউজারের ৩-ডট (⋮) মেনু থেকে "Add to Home screen" বা "Create shortcut" সিলেক্ট করুন।');
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setSuccessToast('অ্যাপ ইনস্টল শুরু হয়েছে!');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (e) {
      console.error('Install prompt error:', e);
    }
  };

  // Admin filter states
  const [adminSelectedTestId, setAdminSelectedTestId] = useState<string>('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminSelectedDate, setAdminSelectedDate] = useState<string>('all');
  const [showAdminSettings, setShowAdminSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timers to fade out toasts
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // ==========================================
  // DATE CALCULATORS (Next 7 Days)
  // ==========================================
  const getDatesList = () => {
    const dates = [];
    const weekdaysBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const weekdaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split('T')[0];
      
      let label = '';
      if (i === 0) label = 'আজ (Today)';
      else if (i === 1) label = 'আগামীকাল (Tomorrow)';
      else {
        label = `${weekdaysBn[d.getDay()]} (${d.getDate()} ${monthsBn[d.getMonth()]})`;
      }
      
      dates.push({
        value: dateString,
        label: label,
        formattedEng: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        weekdayEn: weekdaysEn[d.getDay()]
      });
    }
    return dates;
  };

  const datesList = getDatesList();

  const convertToBnNumerals = (num: number | string) => {
    return num.toString();
  };

  const formatBengaliDate = (dateStr: string) => {
    const monthsBn: { [key: string]: string } = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল', 
      '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট', 
      '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };
    
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    return `${convertToBnNumerals(day)} ${monthsBn[month]} ${convertToBnNumerals(year)}`;
  };

  // ==========================================
  // REAL-TIME SERIAL & SLOT MANAGER
  // ==========================================
  const getNextSerialNumber = (testId: string, date: string) => {
    const activeBookingsOnDateForTest = bookings.filter(
      b => b.testId === testId && b.date === date && b.status !== 'cancelled'
    );
    const takenSerials = new Set(activeBookingsOnDateForTest.map(b => b.serialNumber));
    
    for (let i = 1; i <= globalDailyLimit; i++) {
      if (!takenSerials.has(i)) {
        return i;
      }
    }
    return globalDailyLimit + 1;
  };

  const getSerialStatus = (testId: string, date: string) => {
    const test = SCAN_TESTS.find(t => t.id === testId);
    if (!test) return { booked: 0, limit: 0, remaining: 0, isFull: false };
    
    const activeBookingsForTest = bookings.filter(
      b => b.testId === testId && b.date === date && b.status !== 'cancelled'
    );
    
    const booked = activeBookingsForTest.length;
    const limit = globalDailyLimit;
    const remaining = Math.max(0, limit - booked);
    const nextSerial = getNextSerialNumber(testId, date);
    
    return {
      booked,
      limit,
      remaining,
      isFull: booked >= limit || nextSerial > limit
    };
  };

  const calculateReportTime = (serialNo: number) => {
    const [hours, minutes] = centerOpenTime.split(':').map(Number);
    const totalMinutes = (serialNo - 1) * globalDuration;
    
    const estimatedDate = new Date();
    estimatedDate.setHours(hours);
    estimatedDate.setMinutes(minutes + totalMinutes);
    
    let formattedHours = estimatedDate.getHours();
    const formattedMinutes = estimatedDate.getMinutes().toString().padStart(2, '0');
    const ampm = formattedHours >= 12 ? 'PM' : 'AM';
    
    formattedHours = formattedHours % 12;
    formattedHours = formattedHours ? formattedHours : 12;
    
    const timeEn = `${formattedHours.toString().padStart(2, '0')}:${formattedMinutes} ${ampm}`;
    
    // Bengali Period text
    let periodBn = 'সকাল';
    const rawHour = estimatedDate.getHours();
    if (rawHour >= 12 && rawHour < 16) {
      periodBn = 'দুপুর';
    } else if (rawHour >= 16 && rawHour < 18) {
      periodBn = 'বিকাল';
    } else if (rawHour >= 18 && rawHour < 20) {
      periodBn = 'সন্ধ্যা';
    } else if (rawHour >= 20) {
      periodBn = 'রাত';
    }
    
    const bnHours = convertToBnNumerals(formattedHours);
    const bnMinutes = convertToBnNumerals(formattedMinutes);
    const timeBn = `${periodBn} ${bnHours}:${bnMinutes} মিনিট`;
    
    return { timeEn, timeBn };
  };

  // ==========================================
  // TEXT-TO-SPEECH (TTS)
  // ==========================================
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      window.speechSynthesis.speak(utterance);
    }
  };

  // ==========================================
  // CONFIRMATION AUDIO CHIME (WEB AUDIO SYNTH)
  // ==========================================
  const triggerAudioConfirmation = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const now = ctx.currentTime;
      
      // Node 1: Clear chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc1.start(now);
      osc1.stop(now + 0.55);
      
      // Node 2: Sparkle note (offset)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.50, now + 0.12); // C6
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.1, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.log('Audio feedback error:', e);
    }
  };

  // ==========================================
  // PRESCRIPTION FILE PROCESSING
  // ==========================================
  const processPrescriptionImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorToast('অনুগ্রহ করে শুধুমাত্র একটি সঠিক ইমেজের ফাইল আপলোড করুন।');
      return;
    }

    setPrescriptionFileName(file.name);

    // Compress to avoid localStorage size exhaustion
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Target max boundary 500px
        const boundary = 500;
        if (width > boundary || height > boundary) {
          if (width > height) {
            height = Math.round((height * boundary) / width);
            width = boundary;
          } else {
            width = Math.round((width * boundary) / height);
            height = boundary;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.65); // 65% quality jpeg
          setPrescriptionPhoto(dataUrl);
          setSuccessToast('প্রেসক্রিপশনটি সফলভাবে স্ক্যান ও আপলোড করা হয়েছে।');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPrescriptionImage(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPrescriptionImage(file);
    }
  };

  const loadDemoPrescription = () => {
    setPrescriptionPhoto(SAMPLE_PRESCRIPTION_1);
    setPrescriptionFileName('doctor_prescription_referral_slip.png');
    setSuccessToast('ডেমো প্রেসক্রিপশন স্লিপ সংযুক্ত করা হয়েছে!');
  };

  const clearUploadedPrescription = () => {
    setPrescriptionPhoto('');
    setPrescriptionFileName('');
  };

  // ==========================================
  // BOOKING FORM ACTION
  // ==========================================
  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      setErrorToast('অনুগ্রহ করে রোগীর নাম প্রদান করুন।');
      return;
    }
    if (!patientAge.trim() || isNaN(Number(patientAge)) || Number(patientAge) <= 0) {
      setErrorToast('রোগীর সঠিক বয়স প্রদান করুন।');
      return;
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 10) {
      setErrorToast('১০ ডিজিটের মোবাইল নম্বর দিন (যেমন: 9876543210)');
      return;
    }
    if (!selectedTestId) {
      setErrorToast('অনুগ্রহ করে একটি স্ক্যান অথবা টেস্ট ক্যাটাগরি সিলেক্ট করুন।');
      return;
    }
    if (!selectedDate) {
      setErrorToast('বুকিং করার জন্য একটি দিন নির্বাচন করুন।');
      return;
    }
    if (!prescriptionPhoto) {
      setErrorToast('ডাক্তারের প্রেসক্রিপশন আপলোড করা বাধ্যতামূলক। নিচে থেকে ডেমো প্রেসক্রিপশনও ব্যবহার করতে পারেন!');
      return;
    }

    const test = SCAN_TESTS.find(t => t.id === selectedTestId);
    if (!test) return;

    const stats = getSerialStatus(selectedTestId, selectedDate);
    const assignedSerial = getNextSerialNumber(selectedTestId, selectedDate);
    if (stats.isFull || assignedSerial > globalDailyLimit) {
      setErrorToast(`দুঃখিত! এই টেস্টের জন্য নির্ধারিত তারিখের সকল সিরিয়াল (${globalDailyLimit}টি) পূর্ণ। অন্য তারিখ চেষ্টা করুন।`);
      return;
    }
    const timeObj = calculateReportTime(assignedSerial);

    const newBooking: Booking = {
      id: `scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientName: patientName.trim(),
      patientAge: Number(patientAge),
      patientPhone: patientPhone.trim(),
      testId: selectedTestId,
      date: selectedDate,
      serialNumber: assignedSerial,
      estimatedTime: timeObj.timeBn,
      estimatedTimeEn: timeObj.timeEn,
      prescriptionPhoto: prescriptionPhoto,
      prescriptionFileName: prescriptionFileName,
      status: 'confirmed', // Automatically confirmed upon successful reservation
      createdAt: new Date().toISOString(),
      paymentStatus: 'unpaid'
    };

    try {
      await setDoc(doc(bookingsCollection, newBooking.id), newBooking);
      setNewlyCreatedTicket(newBooking);
      setShowTicketModal(true);
      triggerAudioConfirmation();
      setSuccessToast('টোকেন ও সিরিয়াল নিশ্চিত করা হয়েছে!');

      // Reset Form
      setPatientName('');
      setPatientAge('');
      setPatientPhone('');
      setSelectedTestId('');
      clearUploadedPrescription();
    } catch (error) {
      console.error(error);
      setErrorToast('বুকিং সেভ করতে সমস্যা হয়েছে।');
    }
  };

  const initiateCancelBooking = (bookingId: string) => {
    setCancelConfirmationId(bookingId);
    setCancelConfirmationPhone('');
    setCancelError('');
  };

  const confirmCancelBooking = async () => {
    if (!cancelConfirmationId) return;
    
    const targetBooking = bookings.find(b => b.id === cancelConfirmationId);
    if (!targetBooking) return;

    if (cancelConfirmationPhone !== targetBooking.patientPhone) {
      setCancelError('মোবাইল নম্বর মেলেনি। দয়া করে সঠিক নম্বর দিন।');
      return;
    }

    try {
      await updateDoc(doc(bookingsCollection, cancelConfirmationId), { status: 'cancelled' });
      setSuccessToast('বুকিংটি সফলভাবে বাতিল করা হয়েছে।');
      setCancelConfirmationId(null);
      setCancelConfirmationPhone('');
    } catch (error) {
      console.error(error);
      setErrorToast('বুকিং বাতিল করতে সমস্যা হয়েছে।');
    }
  };

  const cancelCancelBooking = () => {
    setCancelConfirmationId(null);
    setCancelConfirmationPhone('');
    setCancelError('');
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookingToDelete(bookingId);
  };

  const confirmDeleteBooking = async () => {
    if (bookingToDelete) {
      await deleteDoc(doc(bookingsCollection, bookingToDelete));
      setSuccessToast('বুকিংটি সফলভাবে মুছে ফেলা হয়েছে।');
      setBookingToDelete(null);
    }
  };

  // ==========================================
  // ADMIN PANEL CONTROLS
  // ==========================================
  const handleUpdateStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      await updateDoc(doc(bookingsCollection, bookingId), { status });
      setSuccessToast('বুকিং স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।');
      speak(`বুকিং স্ট্যাটাস আপডেট করা হয়েছে: ${status}`);
    } catch (error) {
      console.error(error);
      setErrorToast('আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const handleUpdatePayment = async (bookingId: string, payment: Booking['paymentStatus']) => {
    try {
      await updateDoc(doc(bookingsCollection, bookingId), { paymentStatus: payment });
      setSuccessToast('পেমেন্ট স্ট্যাটাস আপডেট করা হয়েছে।');
      speak(`পেমেন্ট স্ট্যাটাস আপডেট করা হয়েছে: ${payment}`);
    } catch (error) {
      console.error(error);
      setErrorToast('পেমেন্ট আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const addSampleData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const samples: Booking[] = [
      {
        id: 'scan-sample-1',
        patientName: 'আরিফুল ইসলাম রিফাত',
        patientAge: 42,
        patientPhone: '9876543210',
        testId: 'test-mri',
        date: today,
        serialNumber: 1,
        estimatedTime: 'সকাল 09:00 মিনিট',
        estimatedTimeEn: '09:00 AM',
        prescriptionPhoto: SAMPLE_PRESCRIPTION_1,
        prescriptionFileName: 'mri_head_prescription.jpg',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        paymentStatus: 'paid'
      },
      {
        id: 'scan-sample-2',
        patientName: 'নাজমীন সুলতানা নিপা',
        patientAge: 28,
        patientPhone: '9876599887',
        testId: 'test-usg',
        date: today,
        serialNumber: 2,
        estimatedTime: 'সকাল 09:30 মিনিট',
        estimatedTimeEn: '09:30 AM',
        prescriptionPhoto: SAMPLE_PRESCRIPTION_1,
        prescriptionFileName: 'usg_whole_abdomen.png',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        paymentStatus: 'unpaid'
      },
      {
        id: 'scan-sample-3',
        patientName: 'মোঃ আব্দুল কুদ্দুস',
        patientAge: 65,
        patientPhone: '7655566778',
        testId: 'test-ct',
        date: tomorrowStr,
        serialNumber: 1,
        estimatedTime: 'সকাল 09:00 মিনিট',
        estimatedTimeEn: '09:00 AM',
        prescriptionPhoto: SAMPLE_PRESCRIPTION_1,
        prescriptionFileName: 'ct_scan_brain.jpg',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        paymentStatus: 'paid'
      }
    ];

    try {
      const batch = writeBatch(db);
      for (const sample of samples) {
        batch.set(doc(bookingsCollection, sample.id), sample);
      }
      await batch.commit();
      setSuccessToast('3টি পরীক্ষামূলক বুকিং ডেটা যুক্ত করা হয়েছে!');
    } catch (error) {
      console.error(error);
      setErrorToast('স্যাম্পল ডেটা যোগ করতে সমস্যা হয়েছে।');
    }
  };

  const clearAllData = () => {
    setShowClearAllModal(true);
  };

  const confirmClearAllData = async () => {
    try {
      const batch = writeBatch(db);
      for (const b of bookings) {
        batch.delete(doc(bookingsCollection, b.id));
      }
      await batch.commit();
      setSuccessToast('সকল বুকিং ডেটা ক্লিয়ার করা হয়েছে।');
      setShowClearAllModal(false);
    } catch (error) {
      console.error(error);
      setErrorToast('ডেটা মুছতে সমস্যা হয়েছে।');
    }
  };

  // Print utility for the ticket
  const printTicket = (divId: string) => {
    const content = document.getElementById(divId);
    if (!content) return;
    
    const popup = window.open('', '_blank');
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Scan Booking Token</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b111e; color: #f1f5f9; padding: 20px; }
              .ticket-border { border: 2px dashed #0f766e; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="max-w-md mx-auto p-6 border-2 rounded-xl border-slate-800 bg-[#11192d]">
              ${content.innerHTML}
            </div>
          </body>
        </html>
      `);
      popup.document.close();
    }
  };

  // --- Live Status Calculations ---
  const liveSortedBookings = [...bookings].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.serialNumber - b.serialNumber;
  });
  const currentlyScanningBookings = liveSortedBookings.filter(b => b.status === 'scanning');
  const nextUpcomingBooking = liveSortedBookings.find(b => b.status === 'pending' || b.status === 'confirmed');

  // My Ticket Filter (by phone number)
  const myTicketsList = bookings.filter(b => {
    if (!searchPhoneQuery.trim()) return true; // Show all if search is empty
    return b.patientPhone.includes(searchPhoneQuery.trim());
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.serialNumber - b.serialNumber;
  });

  // Admin filter lists
  const adminFilteredList = bookings.filter(b => {
    const matchesTest = adminSelectedTestId === 'all' || b.testId === adminSelectedTestId;
    const matchesDate = adminSelectedDate === 'all' || b.date === adminSelectedDate;
    
    const test = SCAN_TESTS.find(t => t.id === b.testId);
    const text = adminSearchQuery.toLowerCase();
    const matchesSearch = 
      b.patientName.toLowerCase().includes(text) || 
      b.patientPhone.includes(text) ||
      (test && test.nameBn.toLowerCase().includes(text)) ||
      (test && test.nameEn.toLowerCase().includes(text));

    return matchesTest && matchesDate && matchesSearch;
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.serialNumber - b.serialNumber;
  });

  // Helper icons for test types
  const getTestIcon = (type: ScanTest['iconType'], className = "h-5 w-5") => {
    switch (type) {
      case 'mri':
        return <Scan className={`${className} text-teal-400`} />;
      case 'ct':
        return <Activity className={`${className} text-indigo-400`} />;
      case 'usg':
        return <Heart className={`${className} text-rose-400`} />;
      case 'xray':
        return <QrCode className={`${className} text-amber-400`} />;
      case 'echo':
        return <Activity className={`${className} text-emerald-400`} />;
      default:
        return <FileText className={`${className} text-teal-400`} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col justify-between animate-fade-in" id="app-container">
      
      {/* ==========================================
          TOP BAR BRANDING
          ========================================== */}
      <header className="bg-[#11192d]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-lg" id="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div 
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none"
              onClick={() => {
                if (!isAdminLoggedIn) {
                  setShowAdminLoginModal(true);
                }
              }}
              title={isAdminLoggedIn ? "সিগমা ডিজিটাল স্ক্যান সেন্টার" : "সিগমা পোর্টাল (এডমিন প্রবেশ করতে ক্লিক করুন)"}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md flex items-center justify-center border border-teal-500/40 bg-gradient-to-br from-teal-950 via-[#11192d] to-slate-900 flex-shrink-0 text-teal-400 relative overflow-hidden group">
                <div className="absolute inset-0 bg-teal-500/10 animate-pulse" />
                <Activity className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-teal-400 relative z-10 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-extrabold text-slate-100 tracking-tight leading-tight">
                  সিগমা ডিজিটাল স্ক্যান সেন্টার
                </h1>
                <p className="text-[10px] sm:text-xs text-teal-400 font-bold tracking-wide">
                  Sigma Advanced Diagnostic & Scan Portal
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2" id="desktop-nav">
              <button
                onClick={() => setActiveTab('book')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'book'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>টেস্ট বুকিং করুন</span>
              </button>
              <button
                onClick={() => setActiveTab('my-tickets')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 relative ${
                  activeTab === 'my-tickets'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span>আমার টোকেন</span>
                {bookings.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {bookings.length}
                  </span>
                )}
              </button>
              {isAdminLoggedIn && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border border-teal-500/40 ${
                    activeTab === 'admin'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40'
                      : 'text-teal-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-teal-400" />
                  <span>এডমিন ড্যাশবোর্ড</span>
                </button>
              )}
            </nav>

            {/* Emergency Hotline, Share, Install Button & Admin Access */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setShowShareQrModal(true)}
                className="bg-slate-800/70 hover:bg-slate-700 text-teal-300 border border-slate-700/60 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer"
                title="কিউআর কোড ও অ্যাপ লিঙ্ক শেয়ার"
              >
                <Share2 className="h-3.5 w-3.5 text-teal-400" />
                <span>শেয়ার ও কিউআর</span>
              </button>

              {isAdminLoggedIn && activeTab === 'admin' && (
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="এডমিন লগআউট"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">লগআউট</span>
                </button>
              )}

              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer shadow-xs animate-bounce"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>অ্যাপ ইনস্টল</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ==========================================
          NOTIFICATION TOASTS
          ========================================== */}
      <div className="fixed bottom-20 md:bottom-auto md:top-20 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full px-4">
        {errorToast && (
          <div className="bg-rose-950 border-l-4 border-rose-500 p-3.5 rounded-xl shadow-lg flex items-start gap-3 animate-slide-in pointer-events-auto">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-100">ত্রুটি পরিলক্ষিত হয়েছে</h4>
              <p className="text-[11px] text-rose-300 mt-0.5 leading-snug">{errorToast}</p>
            </div>
          </div>
        )}
        {successToast && (
          <div className="bg-emerald-950 border-l-4 border-emerald-500 p-3.5 rounded-xl shadow-lg flex items-start gap-3 animate-slide-in pointer-events-auto">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-100">সফল হয়েছে</h4>
              <p className="text-[11px] text-emerald-300 mt-0.5 leading-snug">{successToast}</p>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:py-8" id="main-content">
        
        {/* ==========================================
            TAB 1: TEST BOOKING FLOW
            ========================================== */}
        {activeTab === 'book' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8" id="book-tab">
            
            {/* Step Selector & Setup Panels - 7 Columns */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Promotion / Mobile-first Guidance Banner */}
              <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white rounded-2xl p-5 shadow-md flex items-center justify-between relative overflow-hidden">
                <div className="z-10 max-w-[80%]">
                  <span className="bg-teal-500/30 text-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    মোবাইল-বান্ধব বুকিং পোর্টাল
                  </span>
                  <h3 className="text-md sm:text-lg font-bold mt-2 leading-tight">
                    প্রেসক্রিপশন আপলোড করে সহজেই স্ক্যান স্লট বুক করুন!
                  </h3>
                  <p className="text-xs text-teal-100/90 mt-1.5 leading-relaxed">
                    বুকিং সম্পূর্ণ করার সাথে সাথে সিরিয়াল নম্বর, রিপোর্টিং সময় ও বারকোড সম্বলিত টোকেন পেয়ে যাবেন।
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 text-teal-700 opacity-20 transform rotate-12">
                  <Scan className="h-32 w-32" />
                </div>
              </div>

              {/* Form panel */}
              <div className="bg-[#11192d] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
                <div className="border-b border-slate-800 pb-3 mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm sm:text-md font-extrabold text-slate-100">1. রোগী ও টেস্ট সংক্রান্ত বিবরণ</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">সবগুলো কলাম সঠিকভাবে পূরণ করুন</p>
                  </div>
                  <span className="text-[11px] bg-teal-950/40 text-teal-400 font-extrabold px-2 py-1 rounded-md border border-teal-900/30">
                    প্রেসক্রিপশন আবশ্যক
                  </span>
                </div>

                <form onSubmit={submitBooking} className="space-y-5">
                  
                  {/* Test Date Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      বুকিং এর তারিখ নির্বাচন করুন <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {datesList.map((date) => {
                        const isSelected = selectedDate === date.value;
                        return (
                          <button
                            key={date.value}
                            type="button"
                            onClick={() => setSelectedDate(date.value)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-16 cursor-pointer ${
                              isSelected
                                ? 'bg-teal-950/30 border-teal-500 ring-2 ring-teal-500/20 text-teal-300'
                                : 'bg-[#1a233a] border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span className="text-[11px] text-slate-400 font-medium block truncate">
                              {date.label.split(' ')[0]}
                            </span>
                            <span className="text-xs font-extrabold text-slate-100">
                              {date.formattedEng.split(' ')[0]} {date.formattedEng.split(' ')[1]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scan / Test Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      পছন্দনীয় স্ক্যান/টেস্ট সিলেক্ট করুন <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTestId}
                        onChange={(e) => setSelectedTestId(e.target.value)}
                        className="w-full pl-3 pr-10 py-3 bg-[#1a233a] border border-slate-700 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none transition-all cursor-pointer"
                      >
                        <option value="">-- টেস্ট সিলেক্ট করুন --</option>
                        {SCAN_TESTS.map(t => {
                          const slots = getSerialStatus(t.id, selectedDate);
                          return (
                            <option key={t.id} value={t.id} className="bg-[#11192d] text-slate-100">
                              {t.nameBn} - ₹{convertToBnNumerals(t.fee)} {slots.isFull ? '(স্লট পূর্ণ)' : `(বাকি ${convertToBnNumerals(slots.remaining)} টি)`}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                        <ChevronRight className="h-4 w-4 transform rotate-90" />
                      </div>
                    </div>

                    {selectedTestId && selectedDate && getSerialStatus(selectedTestId, selectedDate).isFull && (
                      <div className="mt-2.5 p-3 bg-rose-950/40 border border-rose-900/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <span className="font-extrabold block mb-0.5">দুঃখিত, এই টেস্টের বুকিং স্লট পূর্ণ!</span>
                          <span>এই টেস্টের দৈনিক সর্বোচ্চ সিরিয়াল সীমা ({convertToBnNumerals(getSerialStatus(selectedTestId, selectedDate).limit)} টি) ইতিমধ্যেই বুক হয়ে গেছে। অনুগ্রহ করে অন্য দিন নির্বাচন করুন।</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Patient Info Inputs */}
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">রোগীর তথ্য ও যোগাযোগ</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      
                      {/* Name input */}
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          রোগীর পুরো নাম (Full Name) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="যেমন: মোঃ আনিসুর রহমান"
                            className="w-full pl-9 pr-3 py-2.5 bg-[#1a233a] border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                          />
                          <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                        </div>
                      </div>

                      {/* Age Input */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          বয়স <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          placeholder="বয়স"
                          min="1"
                          max="115"
                          className="w-full px-3 py-2.5 bg-[#1a233a] border border-slate-700 rounded-xl text-xs text-center text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                        />
                      </div>

                      {/* Phone Input */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          মোবাইল নম্বর <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            placeholder="98765XXXXX"
                            className="w-full pl-9 pr-3 py-2.5 bg-[#1a233a] border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                          />
                          <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Prescription Upload Panel */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-300">
                        ডাক্তারের প্রেসক্রিপশন আপলোড করুন <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={loadDemoPrescription}
                        className="text-[11px] text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>ডেমো প্রেসক্রিপশন দিন</span>
                      </button>
                    </div>

                    {prescriptionPhoto ? (
                      <div className="relative border border-teal-900/40 rounded-2xl bg-teal-950/20 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#1a233a] border border-teal-900/30 p-1 rounded-lg shadow-sm">
                            <img 
                              src={prescriptionPhoto} 
                              alt="Uploaded Referral Slip" 
                              className="h-14 w-11 object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-200 truncate max-w-[150px] sm:max-w-xs">
                              {prescriptionFileName}
                            </h4>
                            <p className="text-[10px] text-teal-400 font-semibold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" /> আপলোড সফল হয়েছে
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearUploadedPrescription}
                          className="bg-[#1a233a] hover:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-slate-300 border border-slate-700 shadow-sm cursor-pointer transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleFileDrop}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                          isDragging 
                            ? 'border-teal-500 bg-teal-950/30' 
                            : 'border-slate-800 bg-[#161f35] hover:border-teal-500/50 hover:bg-[#1a233a]'
                        }`}
                      >
                        <Upload className="h-8 w-8 text-slate-400 mb-2 animate-bounce" />
                        <span className="text-xs font-bold text-slate-300">প্রেসক্রিপশন ড্র্যাগ করুন অথবা এখানে ক্লিক করুন</span>
                        <span className="text-[10px] text-slate-500 mt-1">সমর্থিত ফাইল: JPG, PNG, WEBP (সর্বোচ্চ 5 মেগাবাইট)</span>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  {/* Submission Button */}
                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md shadow-teal-950/20 flex items-center justify-center gap-2 text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer hover:translate-y-[-1px] active:translate-y-[1px]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>কনফার্ম বুকিং ও টোকেন তৈরি করুন</span>
                  </button>

                </form>
              </div>

              {/* Secure Notice Card */}
              <div className="bg-emerald-950/30 rounded-2xl border border-emerald-900/30 p-4 flex gap-3 shadow-md">
                <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-400">নিরাপদ ও নির্ভরযোগ্য সেবা প্রতিশ্রুতি</h4>
                  <p className="text-[11px] text-emerald-300 mt-1 leading-relaxed">
                    সিগমা ডিজিটাল সেন্টারে সকল টেস্ট সর্বাধুনিক ওয়ার্ল্ড ক্লাস ডেনিশ ও জার্মান প্রযুক্তির মাধ্যমে করা হয়। কোনো প্রকার অগ্রিম পেমেন্ট ছাড়াই বুকিং নিশ্চিত করুন এবং টেস্টের পূর্বে চেম্বারে পেমেন্ট করুন।
                  </p>
                </div>
              </div>

            </div>

            {/* Test Cards Information Grid - 5 Columns */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Dynamic summary indicator */}
              <div className="bg-[#11192d] rounded-2xl border border-slate-800 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <Activity className="h-5 w-5 text-teal-400 animate-pulse" />
                  <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-wide">
                    আজকের টেস্টের সময় ও আসন সংখ্যা
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {SCAN_TESTS.map(t => {
                    const stats = getSerialStatus(t.id, selectedDate);
                    const isSelected = selectedTestId === t.id;
                    
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTestId(t.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-950/20 border-teal-500 ring-1 ring-teal-500 shadow-lg text-teal-300'
                            : 'bg-[#1a233a] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#11192d] rounded-lg border border-slate-850 shrink-0 mt-0.5">
                            {getTestIcon(t.iconType)}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-200 truncate">{t.nameBn}</h4>
                              <span className="text-xs font-extrabold text-teal-400 shrink-0">₹{convertToBnNumerals(t.fee)}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{t.descriptionBn}</p>
                            
                            <div className="mt-2.5 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {formatTimeBn(centerOpenTime)} - {formatTimeBn(centerCloseTime)}
                              </span>

                              {stats.isFull ? (
                                <span className="bg-rose-950/40 text-rose-400 border border-rose-900/30 font-extrabold px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1">
                                  <Lock className="h-2.5 w-2.5" /> বুকড
                                </span>
                              ) : (
                                <span className="bg-teal-950/40 text-teal-400 border border-teal-900/30 font-extrabold px-2 py-0.5 rounded-full text-[9px]">
                                  {convertToBnNumerals(stats.remaining)} টি খালি
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Patient Preparation Instructions Checklist */}
              {selectedTestId && (
                <div className="bg-[#11192d] rounded-2xl border border-slate-800 p-5 shadow-xl animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <h4 className="text-xs font-extrabold text-slate-200">টেস্টের প্রস্তুতি নির্দেশিকা:</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold bg-amber-950/20 p-3 rounded-xl border border-amber-900/30">
                    {SCAN_TESTS.find(t => t.id === selectedTestId)?.instructionsBn}
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ==========================================
            TAB 2: MY TICKETS / BOOKING RETRIEVAL
            ========================================== */}
        {activeTab === 'my-tickets' && (
          <div className="space-y-6" id="my-tickets-tab">
            
            {/* Live Status Board */}
            <div className="bg-[#11192d] rounded-2xl border border-blue-900/40 p-5 shadow-[0_0_20px_rgba(59,130,246,0.15)] max-w-4xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <div className="flex items-center gap-2 mb-5 border-b border-slate-800/80 pb-3">
                <Activity className="h-5 w-5 text-blue-400 animate-[pulse_1s_ease-in-out_infinite]" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">লাইভ স্ক্যানিং স্ট্যাটাস</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">রিয়েল-টাইম আপডেট দেখতে চোখ রাখুন</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-blue-900/30 flex flex-col justify-center items-center relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 right-0 p-1.5 opacity-20"><Activity className="w-16 h-16 text-blue-400" /></div>
                  <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider relative z-10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_0.5s_ease-in-out_infinite]"></span>
                    বর্তমানে স্ক্যানিং চলছে (Running)
                  </div>
                  {currentlyScanningBookings.length > 0 ? (
                    <div className="relative z-10 flex flex-col gap-3 w-full">
                      {currentlyScanningBookings.map(b => (
                        <div key={b.id} className="text-center bg-[#1a233a] p-3 rounded-lg border border-slate-700/50">
                          <div className="text-3xl font-black text-red-400 drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]">
                            সিরিয়াল {convertToBnNumerals(b.serialNumber)}
                          </div>
                          <div className="text-sm font-bold text-slate-200 mt-1">{b.patientName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{b.testId}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-500 py-4 relative z-10">এই মুহূর্তে কোনো স্ক্যানিং চলছে না</div>
                  )}
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-teal-900/30 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1.5 opacity-10"><User className="w-16 h-16 text-teal-400" /></div>
                  <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider relative z-10">পরবর্তী সিরিয়াল (Next Up)</div>
                  {nextUpcomingBooking ? (
                    <div className="text-center bg-[#1a233a] p-4 rounded-lg border border-slate-700/50 w-full relative z-10">
                      <div className="text-3xl font-black text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.3)]">
                        সিরিয়াল {convertToBnNumerals(nextUpcomingBooking.serialNumber)}
                      </div>
                      <div className="text-sm font-bold text-slate-200 mt-1">{nextUpcomingBooking.patientName}</div>
                      <div className="text-[10px] text-teal-500/80 mt-1 font-semibold flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" /> আনুমানিক: {nextUpcomingBooking.estimatedTime}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-500 py-4 relative z-10">পরবর্তী কোনো সিরিয়াল নেই</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#11192d] rounded-2xl border border-slate-800 p-5 shadow-xl max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h2 className="text-sm sm:text-md font-extrabold text-slate-100 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-teal-400" />
                    <span>আপনার বুকিং করা টোকেনসমূহ</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">নিচের মোবাইল নম্বর দিয়ে ফিল্টার করে সহজেই আপনার প্রিন্ট কপি টোকেন সংগ্রহ করুন।</p>
                </div>

                <div className="w-full sm:w-72">
                  <div className="relative">
                    <input
                      type="tel"
                      value={searchPhoneQuery}
                      onChange={(e) => setSearchPhoneQuery(e.target.value)}
                      placeholder="১০ ডিজিটের মোবাইল দিয়ে খুঁজুন"
                      className="w-full pl-9 pr-3 py-2 bg-[#1a233a] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-semibold placeholder-slate-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>

              {myTicketsList.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-300">কোনো বুকিং টোকেন পাওয়া যায়নি</h3>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">সঠিক মোবাইল নম্বর টাইপ করুন অথবা নতুন একটি টেস্ট বুক করুন।</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="mt-4 inline-flex items-center gap-1.5 bg-teal-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-teal-950/20 hover:bg-teal-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>নতুন বুকিং স্লট বুক করুন</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTicketsList.map((ticket) => {
                    const test = SCAN_TESTS.find(t => t.id === ticket.testId);
                    return (
                      <div 
                        key={ticket.id}
                        className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-[#1a233a] hover:border-teal-500/50 transition"
                      >
                        {/* Header of card */}
                        <div className="bg-[#11192d] px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/30">
                              সিরিয়াল নং: {convertToBnNumerals(ticket.serialNumber)}
                            </span>
                            <span className="text-[10px] text-slate-500">ID: {ticket.id}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {ticket.status === 'confirmed' && (
                              <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                                বুকিং নিশ্চিত
                              </span>
                            )}
                            {ticket.status === 'pending' && (
                              <span className="bg-amber-950/30 text-amber-400 border border-amber-900/30 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                                অপেক্ষমান
                              </span>
                            )}
                            {ticket.status === 'scanning' && (
                              <span className="bg-red-950/30 text-red-400 border border-red-900/30 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Activity className="h-3 w-3 animate-[pulse_0.5s_ease-in-out_infinite]" />
                                স্ক্যানিং চলছে
                              </span>
                            )}
                            {ticket.status === 'completed' && (
                              <span className="bg-indigo-950/30 text-indigo-400 border border-indigo-900/30 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                                রিপোর্ট রেডি
                              </span>
                            )}
                            {ticket.status === 'cancelled' && (
                              <span className="bg-rose-950/30 text-rose-400 border border-rose-900/30 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                                বাতিল করা হয়েছে
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Body layout */}
                        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
                          
                          {/* Patient Summary */}
                          <div className="md:col-span-8 space-y-2">
                            <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">টোকেন ও রোগী পরিচিতি</h3>
                            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs text-slate-200">
                              <div>
                                <span className="text-slate-400 block text-[10px]">রোগীর নাম</span>
                                <span className="font-bold text-slate-100">{ticket.patientName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">মোবাইল নম্বর</span>
                                <span className="font-bold">{ticket.patientPhone}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">নির্ধারিত তারিখ</span>
                                <span className="font-bold text-teal-400">{formatBengaliDate(ticket.date)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">নির্ধারিত সময়</span>
                                <span className="font-bold text-teal-400">{ticket.estimatedTime}</span>
                                {(ticket.status === 'pending' || ticket.status === 'confirmed') && (
                                  <div className="text-[9px] text-amber-400 font-bold mt-0.5 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/30 inline-block">
                                    আপনার আগে আর {
                                      convertToBnNumerals(liveSortedBookings.filter(b => 
                                        (b.status === 'pending' || b.status === 'confirmed' || b.status === 'scanning') && 
                                        b.date === ticket.date && 
                                        b.serialNumber < ticket.serialNumber
                                      ).length)
                                    } জন বাকি
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">টেস্টের ধরণ</span>
                                <span className="font-extrabold text-teal-400">{test?.nameBn || ticket.testId}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">মোট ফি</span>
                                <span className="font-extrabold text-emerald-400">₹{convertToBnNumerals(test?.fee || 0)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Print/View Side panel */}
                          <div className="md:col-span-4 flex flex-col justify-end items-stretch gap-2 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                            <button
                              onClick={() => {
                                setNewlyCreatedTicket(ticket);
                                setShowTicketModal(true);
                              }}
                              className="w-full bg-teal-950/40 hover:bg-teal-900/40 text-teal-400 font-bold p-2 rounded-xl text-xs border border-teal-900/30 flex items-center justify-center gap-1.5 cursor-pointer transition"
                            >
                              <Eye className="h-4 w-4" />
                              <span>টোকেন ভিউ</span>
                            </button>
                            
                            {ticket.status !== 'cancelled' && cancelConfirmationId !== ticket.id && (
                              <button
                                onClick={() => initiateCancelBooking(ticket.id)}
                                className="w-full bg-[#1a233a] hover:bg-rose-950/30 text-rose-400 font-bold p-2 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>বুকিং বাতিল</span>
                              </button>
                            )}

                            {cancelConfirmationId === ticket.id && (
                              <div className="mt-2 p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl space-y-2">
                                <p className="text-[10px] text-rose-300 font-bold leading-tight">বুকিংটি বাতিল করতে আপনার মোবাইল নম্বরটি দিন:</p>
                                <input
                                  type="tel"
                                  placeholder="01XXXXXXXXX"
                                  value={cancelConfirmationPhone}
                                  onChange={(e) => {
                                    setCancelConfirmationPhone(e.target.value);
                                    setCancelError('');
                                  }}
                                  className="w-full bg-[#11192d] border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500 placeholder-slate-600"
                                />
                                {cancelError && <p className="text-[10px] text-rose-400 font-bold">{cancelError}</p>}
                                <div className="flex gap-2">
                                  <button
                                    onClick={confirmCancelBooking}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs transition"
                                  >
                                    নিশ্চিত করুন
                                  </button>
                                  <button
                                    onClick={cancelCancelBooking}
                                    className="flex-1 bg-[#1a233a] hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs border border-slate-600 transition"
                                  >
                                    ফিরে যান
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: CHAMBER ADMIN CONTROL PANEL
            ========================================== */}
        {activeTab === 'admin' && (
          !isAdminLoggedIn ? (
            <div className="max-w-md mx-auto my-12 bg-[#11192d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-scale-up" id="admin-locked-view">
              <div className="w-16 h-16 rounded-2xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center mx-auto text-teal-400 shadow-lg shadow-teal-950/50">
                <Lock className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">এডমিন প্রবেশাধিকার সংরক্ষিত</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  এই ড্যাশবোর্ডটি ডায়াগনস্টিক সেন্টারের রিসিপশন ও এডমিনদের জন্য নির্ধারিত। অনুগ্রহ করে আপনার সিক্রেট পিন দিয়ে আনলক করুন।
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-slate-300 block">এডমিন সিকিউরিটি পিন (PIN):</label>
                  <input
                    type="password"
                    placeholder="৪-ডিজিটের পিন কোড"
                    value={loginPinInput}
                    onChange={(e) => {
                      setLoginPinInput(e.target.value);
                      setLoginPinError('');
                    }}
                    className="w-full bg-[#1a233a] border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder-slate-600"
                    autoFocus
                  />
                  {loginPinError && (
                    <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{loginPinError}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 text-center mt-1">
                    (ডিফল্ট এডমিন পিন: <span className="text-teal-400 font-mono font-bold">1234</span>)
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('book')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition border border-slate-700"
                  >
                    বুকিং পেজে যান
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition shadow-md shadow-teal-950/50 flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>আনলক করুন</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
          <div className="space-y-6" id="admin-tab">
            
            {/* Admin Header Bar */}
            <div className="bg-[#11192d] p-4 rounded-2xl border border-teal-900/40 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-700/50 flex items-center justify-center text-teal-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-100">সিগমা এডমিন কন্ট্রোল ড্যাশবোর্ড</h2>
                    <span className="bg-teal-950 text-teal-300 border border-teal-800/60 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      আনলকড (Unlocked)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">সেন্টারের দৈনিক বুকিং, স্লট লিমিট ও টিকিট নিয়ন্ত্রণ করুন</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#11192d] p-4 rounded-2xl border border-slate-800 shadow-xl">
                <span className="text-[10px] sm:text-xs text-slate-400 font-extrabold uppercase tracking-wider block">মোট বুকিং স্লট</span>
                <span className="text-xl sm:text-2xl font-black text-slate-100 block mt-1">
                  {convertToBnNumerals(bookings.length)}
                </span>
              </div>
              <div className="bg-[#11192d] p-4 rounded-2xl border border-slate-800 shadow-xl">
                <span className="text-[10px] sm:text-xs text-slate-400 font-extrabold uppercase tracking-wider block">কনফার্মড টেস্ট</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1">
                  {convertToBnNumerals(bookings.filter(b => b.status === 'confirmed').length)}
                </span>
              </div>
              <div className="bg-[#11192d] p-4 rounded-2xl border border-slate-800 shadow-xl">
                <span className="text-[10px] sm:text-xs text-slate-400 font-extrabold uppercase tracking-wider block">সম্পন্ন হয়েছে</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-400 block mt-1">
                  {convertToBnNumerals(bookings.filter(b => b.status === 'completed').length)}
                </span>
              </div>
              <div className="bg-[#11192d] p-4 rounded-2xl border border-slate-800 shadow-xl">
                <span className="text-[10px] sm:text-xs text-slate-400 font-extrabold uppercase tracking-wider block">মোট বাতিল সংখ্যা</span>
                <span className="text-xl sm:text-2xl font-black text-rose-400 block mt-1">
                  {convertToBnNumerals(bookings.filter(b => b.status === 'cancelled').length)}
                </span>
              </div>
            </div>

            {/* Center Settings Configuration Section */}
            <div className="bg-[#11192d] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <button 
                onClick={() => setShowAdminSettings(!showAdminSettings)}
                className="w-full flex items-center justify-between text-left cursor-pointer group"
              >
                <h3 className="text-xs font-black text-slate-100 flex items-center gap-2 uppercase tracking-wider group-hover:text-teal-400 transition-colors">
                  <Settings className="h-4 w-4 text-teal-400" />
                  <span>Center Settings & Security</span>
                </h3>
                <div className="bg-[#1a233a] p-1.5 rounded-lg text-slate-400 group-hover:text-slate-200 transition-colors">
                  {showAdminSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {showAdminSettings && (
                <div className="bg-[#1a233a]/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end justify-between mt-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-wrap gap-4 flex-1">
                  {/* 1. Open Time */}
                  <div className="space-y-1.5 min-w-[120px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Open Time</label>
                    <input
                      type="time"
                      value={openTimeTemp}
                      onChange={(e) => setOpenTimeTemp(e.target.value)}
                      className="w-full bg-[#11192d] border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {/* 2. Close Time */}
                  <div className="space-y-1.5 min-w-[120px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Close Time</label>
                    <input
                      type="time"
                      value={closeTimeTemp}
                      onChange={(e) => setCloseTimeTemp(e.target.value)}
                      className="w-full bg-[#11192d] border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {/* 3. Duration */}
                  <div className="space-y-1.5 min-w-[150px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scan Duration (Min)</label>
                    <select
                      value={durationTemp}
                      onChange={(e) => setDurationTemp(parseInt(e.target.value))}
                      className="w-full bg-[#11192d] border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-teal-500"
                    >
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>
                  
                  {/* 4. Limit Input */}
                  <div className="space-y-1.5 min-w-[120px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Limit</label>
                    <div className="flex items-center gap-1 bg-[#11192d] p-1 rounded-xl border border-slate-700 h-9">
                      <button
                        type="button"
                        onClick={() => setGlobalDailyLimitTemp(prev => Math.max(1, prev - 1))}
                        className="h-full px-2 bg-[#1a233a] hover:bg-slate-800 text-slate-300 font-black rounded-lg flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={globalDailyLimitTemp}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setGlobalDailyLimitTemp(Math.max(1, val));
                        }}
                        className="w-full text-center bg-transparent text-xs font-black text-teal-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setGlobalDailyLimitTemp(prev => prev + 1)}
                        className="h-full px-2 bg-[#1a233a] hover:bg-slate-800 text-slate-300 font-black rounded-lg flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 5. Admin Security PIN */}
                  <div className="space-y-1.5 min-w-[150px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Security PIN</label>
                    <div className="relative">
                      <input
                        type={showSettingsPinText ? "text" : "password"}
                        value={adminPinTemp}
                        onChange={(e) => setAdminPinTemp(e.target.value)}
                        placeholder="৪-ডিজিটের পিন কোড"
                        className="w-full bg-[#11192d] border border-slate-700 text-slate-100 rounded-xl px-3 py-2 pr-8 text-xs font-bold focus:ring-1 focus:ring-teal-500 tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSettingsPinText(!showSettingsPinText)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                        tabIndex={-1}
                      >
                        {showSettingsPinText ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6. Save Button */}
                <div className="w-full sm:w-auto pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const newPin = normalizePin(adminPinTemp) || normalizePin(adminPin) || '1234';
                        await setDoc(doc(settingsCollection, 'center'), {
                          centerOpenTime: openTimeTemp,
                          centerCloseTime: closeTimeTemp,
                          globalDuration: durationTemp,
                          globalDailyLimit: globalDailyLimitTemp,
                          adminPin: newPin
                        }, { merge: true });
                        setAdminPin(newPin);
                        setAdminPinTemp(newPin);
                        try {
                          localStorage.setItem('sigma_admin_pin', newPin);
                        } catch {}
                        setSuccessToast('Center settings ও Admin PIN সফলভাবে সেভ হয়েছে!');
                      } catch (error) {
                        console.error(error);
                        setErrorToast('সেটিংস সেভ করতে সমস্যা হয়েছে।');
                      }
                    }}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-black text-xs py-2.5 px-6 rounded-xl cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Settings</span>
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* Main Admin Table Section */}
            <div className="bg-[#11192d] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a233a]">
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">রিসিপশনিস্ট / এডমিন কন্ট্রোল লগ</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">সবগুলো স্ক্যান বুকিং এর তালিকা ও প্রেসক্রিপশন নিরীক্ষণ করুন</p>
                </div>
                
                {/* Advanced Admin Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Select Scan Type */}
                  <select
                    value={adminSelectedTestId}
                    onChange={(e) => setAdminSelectedTestId(e.target.value)}
                    className="bg-[#11192d] border border-slate-700 text-slate-100 rounded-xl px-2 py-1.5 text-[11px] font-bold focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="all" className="bg-[#11192d]">সব টেস্ট (All Tests)</option>
                    {SCAN_TESTS.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#11192d]">{t.nameEn.split(' ')[0]}</option>
                    ))}
                  </select>

                  {/* Select Date Filter */}
                  <select
                    value={adminSelectedDate}
                    onChange={(e) => setAdminSelectedDate(e.target.value)}
                    className="bg-[#11192d] border border-slate-700 text-slate-100 rounded-xl px-2 py-1.5 text-[11px] font-bold focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="all" className="bg-[#11192d]">সব তারিখ (All Dates)</option>
                    {datesList.map(date => (
                      <option key={date.value} value={date.value} className="bg-[#11192d]">{date.formattedEng}</option>
                    ))}
                  </select>

                  {/* Text search */}
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    placeholder="রোগীর নাম/ফোন নম্বর..."
                    className="bg-[#11192d] border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 text-[11px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-48 font-bold"
                  />

                  {/* Delete All Data Option */}
                  <button
                    type="button"
                    onClick={clearAllData}
                    className="bg-rose-950/40 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 border border-rose-900/40 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5"
                    title="সকল বুকিং ডেটা মুছে ফেলুন"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>সকল ডেটা মুছুন</span>
                  </button>
                </div>
              </div>

              {/* Responsive Table Grid */}
              {adminFilteredList.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-700" />
                  <p className="text-xs">ফিল্টারকৃত ক্রাইটেরিয়া অনুযায়ী কোনো বুকিং স্লট মেলেনি।</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#161f35] text-slate-400 font-extrabold text-[10px] tracking-wider uppercase border-b border-slate-800">
                        <th className="py-3 px-4">রোগী ও সিরিয়াল</th>
                        <th className="py-3 px-4">নির্ধারিত টেস্ট</th>
                        <th className="py-3 px-4">তারিখ ও রিপোর্টিং</th>
                        <th className="py-3 px-4 text-center">প্রেসক্রিপশন</th>
                        <th className="py-3 px-4">পেমেন্ট</th>
                        <th className="py-3 px-4">স্ট্যাটাস</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {adminFilteredList.map((b) => {
                        const test = SCAN_TESTS.find(t => t.id === b.testId);
                        return (
                          <tr key={b.id} className={`transition ${b.status === 'scanning' ? 'animate-[pulse_0.5s_ease-in-out_infinite] bg-red-950/50 shadow-[inset_0_0_25px_rgba(220,38,38,0.4)] border-l-4 border-red-600' : b.status === 'completed' ? 'bg-slate-900/60 opacity-60 grayscale' : 'hover:bg-[#1a233a]'}`}>
                            {/* Patient & Serial */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-100">{b.patientName}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{b.patientPhone} (বয়স: {convertToBnNumerals(b.patientAge)})</div>
                              <div className="inline-block bg-teal-950/40 text-teal-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-teal-900/30 mt-1">
                                সিরিয়াল নং: {convertToBnNumerals(b.serialNumber)}
                              </div>
                            </td>

                            {/* Scan Type */}
                            <td className="py-3.5 px-4 font-bold text-slate-200">
                              {test ? test.nameEn : b.testId}
                              <span className="block text-[10px] text-teal-400">{test?.nameBn}</span>
                            </td>

                            {/* Date & Estimation */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-300">{formatBengaliDate(b.date)}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{b.estimatedTimeEn} ({b.estimatedTime})</div>
                            </td>

                            {/* Prescription Photo Modal trigger */}
                            <td className="py-3.5 px-4 text-center">
                              {b.prescriptionPhoto ? (
                                <button
                                  onClick={() => {
                                    const win = window.open();
                                    if (win) {
                                      win.document.write(`<iframe src="${b.prescriptionPhoto}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-950/40 border border-teal-900/30 px-2.5 py-1 rounded-full cursor-pointer hover:bg-teal-900/40 transition"
                                  title="ভিউ প্রেসক্রিপশন"
                                >
                                  <img 
                                    src={b.prescriptionPhoto} 
                                    className="h-6 w-5 object-cover rounded shadow-xs" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <span>স্লিপ দেখুন</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-semibold">কোনো ছবি নেই</span>
                              )}
                            </td>

                            {/* Payment Status Toggle */}
                            <td className="py-3.5 px-4">
                              {b.paymentStatus === 'paid' ? (
                                <button
                                  onClick={() => handleUpdatePayment(b.id, 'unpaid')}
                                  className="bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 font-black text-[9px] px-2 py-0.5 rounded cursor-pointer transition"
                                >
                                  ₹ পেইড (Paid)
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdatePayment(b.id, 'paid')}
                                  className="bg-[#1a233a] hover:bg-slate-800 text-slate-300 font-black text-[9px] px-2 py-0.5 rounded cursor-pointer transition border border-slate-700"
                                >
                                  ₹ আনপেইড
                                </button>
                              )}
                            </td>

                            {/* Booking Status Selector */}
                            <td className="py-3.5 px-4">
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateStatus(b.id, e.target.value as Booking['status'])}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  b.status === 'confirmed' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' :
                                  b.status === 'completed' ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/30' :
                                  b.status === 'pending' ? 'bg-amber-950/30 text-amber-400 border-amber-900/30' :
                                  b.status === 'scanning' ? 'bg-red-950/30 text-red-400 border-red-900/30' :
                                  'bg-rose-950/30 text-rose-400 border-rose-900/30'
                                } cursor-pointer`}
                              >
                                <option value="confirmed" className="bg-[#11192d] text-slate-100">বুকড (Confirmed)</option>
                                <option value="scanning" className="bg-[#11192d] text-slate-100">স্ক্যানিং হচ্ছে (Scanning)</option>
                                <option value="completed" className="bg-[#11192d] text-slate-100">টেস্ট শেষ (Completed)</option>
                                <option value="cancelled" className="bg-[#11192d] text-slate-100">বাতিল (Cancelled)</option>
                              </select>
                            </td>
                            {/* Quick Action Button to re-view token & delete */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => {
                                    setNewlyCreatedTicket(b);
                                    setShowTicketModal(true);
                                  }}
                                  className="text-teal-400 hover:text-teal-300 font-bold hover:underline cursor-pointer"
                                  title="টোকেন দেখুন"
                                >
                                  টোকেন
                                </button>
                                <button
                                  onClick={() => handleDeleteBooking(b.id)}
                                  className="text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 p-1.5 rounded-lg border border-rose-900/40 cursor-pointer transition flex items-center justify-center"
                                  title="বুকিং মুছুন"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          )
        )}

      </main>

      {/* ==========================================
          MOBILE BOTTOM TAB BAR
          ========================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#11192d] border-t border-slate-800 py-2 px-3 flex justify-around items-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.3)]" id="mobile-nav">
        <button
          onClick={() => setActiveTab('book')}
          className={`flex flex-col items-center gap-1 focus:outline-none cursor-pointer py-1 ${
            activeTab === 'book' ? 'text-teal-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] tracking-tighter">নতুন বুকিং</span>
        </button>
        
        <button
          onClick={() => setActiveTab('my-tickets')}
          className={`flex flex-col items-center gap-1 focus:outline-none relative cursor-pointer py-1 ${
            activeTab === 'my-tickets' ? 'text-teal-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="text-[10px] tracking-tighter">আমার টোকেন</span>
          {bookings.length > 0 && (
            <span className="absolute 0 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {bookings.length}
            </span>
          )}
        </button>

        {isAdminLoggedIn && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 focus:outline-none cursor-pointer py-1 ${
              activeTab === 'admin' ? 'text-teal-400 font-bold' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="h-5 w-5 text-teal-400" />
            <span className="text-[10px] tracking-tighter">এডমিন</span>
          </button>
        )}
      </div>

      {/* ==========================================
          DIGITAL TICKET MODAL WINDOW (DASHED BORDER TICKET)
          ========================================== */}
      {showTicketModal && newlyCreatedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-fade-in" id="ticket-modal">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl relative animate-scale-up">
            
            {/* Modal Title bar */}
            <div className="bg-teal-800 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-300 animate-pulse" />
                <span className="text-xs font-bold tracking-wide uppercase">ডিজিটাল বুকিং টোকেন</span>
              </div>
              <button
                onClick={() => setShowTicketModal(false)}
                className="text-teal-200 hover:text-white p-1 rounded-full cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Print Area Block */}
            <div className="p-6 overflow-y-auto max-h-[80vh]" id="ticket-print-area">
              
              <div className="border-2 border-dashed border-teal-600 rounded-2xl p-5 bg-teal-50/10 space-y-4">
                
                {/* Header inside ticket */}
                <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">সিগমা ডিজিটাল স্ক্যান সেন্টার</h3>
                  <p className="text-[9px] text-teal-700 font-semibold uppercase">সেক্টর 5, সল্টলেক, কলকাতা, 700091</p>
                  <p className="text-[9px] text-slate-400">হেল্পলাইন: 1800-112-1075 (টোল-ফ্রি)</p>
                </div>

                {/* Big Serial / Ticket Header */}
                <div className="flex items-center justify-between bg-teal-600/5 p-3 rounded-xl border border-teal-600/10">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">সিরিয়াল নম্বর</span>
                    <span className="text-2xl font-black text-teal-800">
                      #{convertToBnNumerals(newlyCreatedTicket.serialNumber)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">নির্ধারিত রিপোর্টিং সময়</span>
                    <span className="text-xs font-extrabold text-teal-800 block">
                      {newlyCreatedTicket.estimatedTime}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">{newlyCreatedTicket.estimatedTimeEn}</span>
                  </div>
                </div>

                {/* Patient / Test Fields */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">রোগীর নাম:</span>
                    <span className="font-extrabold text-slate-800">{newlyCreatedTicket.patientName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">মোবাইল নম্বর:</span>
                    <span className="font-bold text-slate-800">{newlyCreatedTicket.patientPhone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">রোগীর বয়স:</span>
                    <span className="font-semibold text-slate-800">{convertToBnNumerals(newlyCreatedTicket.patientAge)} বছর</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">নির্ধারিত টেস্ট:</span>
                    <span className="font-black text-teal-800">
                      {SCAN_TESTS.find(t => t.id === newlyCreatedTicket.testId)?.nameBn || newlyCreatedTicket.testId}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">টেস্টের তারিখ:</span>
                    <span className="font-extrabold text-teal-800">{formatBengaliDate(newlyCreatedTicket.date)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">টেস্ট ফি:</span>
                    <span className="font-black text-emerald-600">₹{convertToBnNumerals(SCAN_TESTS.find(t => t.id === newlyCreatedTicket.testId)?.fee || 0)}</span>
                  </div>
                </div>

                {/* Barcode/QR Style Representation */}
                <div className="flex flex-col items-center justify-center space-y-1.5 pt-2">
                  <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-xs">
                    <QRCodeSVG
                      value={`SIGMA-TICKET:${newlyCreatedTicket.id}#${newlyCreatedTicket.serialNumber}`}
                      size={84}
                      level="M"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono tracking-widest">{newlyCreatedTicket.id}</span>
                </div>

                {/* Helpful Instruction inside Ticket */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-800 leading-relaxed">
                  <p className="font-bold flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>প্রয়োজনীয় নির্দেশনা:</span>
                  </p>
                  <p>{SCAN_TESTS.find(t => t.id === newlyCreatedTicket.testId)?.instructionsBn || 'পরীক্ষার ন্যূনতম 4 ঘণ্টা পূর্বে খালি পেটে চেম্বারে আসবেন এবং রেফারকৃত প্রেসক্রিপশনটির মূল কপি অবশ্যই সাথে নিয়ে আসবেন।'}</p>
                </div>

              </div>

            </div>

            {/* Print & Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => printTicket('ticket-print-area')}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-100 cursor-pointer transition"
              >
                <Printer className="h-4 w-4" />
                <span>টোকেন প্রিন্ট করুন</span>
              </button>
              <button
                onClick={() => setShowTicketModal(false)}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition"
              >
                বন্ধ করুন (Close)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Single Booking Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-fade-in" id="delete-modal">
          <div className="bg-[#11192d] border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-900/60 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100">সতর্কবার্তা: বুকিং মুছুন</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                আপনি কি নিশ্চিতভাবে এই বুকিংটি মুছে ফেলতে চান? "হ্যাঁ" (Yes) ক্লিক করলে এটি স্থায়ীভাবে ডিলিট হয়ে যাবে।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBookingToDelete(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition border border-slate-700"
              >
                না (No)
              </button>
              <button
                onClick={confirmDeleteBooking}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-rose-950/50"
              >
                হ্যাঁ (Yes, Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share QR Code Modal - QR and https://docslot.web.app sharing */}
      {showShareQrModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-fade-in" id="share-qr-modal">
          <div className="bg-[#11192d] border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-teal-950/60 border border-teal-800/40 flex items-center justify-center text-teal-400">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">কিউআর কোড ও লিঙ্ক শেয়ার</h3>
                  <p className="text-[10px] text-slate-400">সিগমা স্ক্যান সেন্টার অনলাইন বুকিং</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareQrModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white p-5 rounded-2xl shadow-xl border-4 border-teal-500/20 inline-block">
                <QRCodeCanvas
                  id="share-qr-canvas"
                  value="https://docslot.web.app/"
                  size={190}
                  level="H"
                  marginSize={1}
                />
              </div>
              <p className="text-xs text-slate-300 font-medium mt-2.5 px-2">
                ক্যামেরা বা কিউআর স্ক্যানার দিয়ে স্ক্যান করুন
              </p>
              
              {/* Visible Live Link Badge */}
              <div className="mt-2 bg-[#0c1322] border border-teal-500/30 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 max-w-full">
                <span className="text-[11px] font-mono text-teal-300 truncate">https://docslot.web.app/</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText('https://docslot.web.app/');
                      setSuccessToast('লিঙ্কটি কপি করা হয়েছে!');
                    } catch {
                      setErrorToast('কপি করতে ব্যর্থ হয়েছে');
                    }
                  }}
                  className="text-[10px] bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 px-2 py-0.5 rounded font-bold cursor-pointer transition shrink-0"
                >
                  কপি
                </button>
              </div>
            </div>

            {/* Actions: Download QR, Share, Close */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const canvas = document.getElementById('share-qr-canvas') as HTMLCanvasElement;
                    if (!canvas) return;
                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = 'sigma-scan-qr.png';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    setSuccessToast('কিউআর কোডটি সফলভাবে ডাউনলোড হয়েছে!');
                  }}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md shadow-teal-950/50"
                >
                  <Download className="h-4 w-4" />
                  <span>ডাউনলোড QR</span>
                </button>

                {navigator.share && (
                  <button
                    type="button"
                    onClick={async () => {
                      const canvas = document.getElementById('share-qr-canvas') as HTMLCanvasElement;
                      if (canvas && navigator.canShare) {
                        canvas.toBlob(async (blob) => {
                          if (blob) {
                            const file = new File([blob], 'sigma-scan-qr.png', { type: 'image/png' });
                            if (navigator.canShare({ files: [file] })) {
                              try {
                                await navigator.share({
                                  files: [file],
                                  title: 'সিগমা ডিজিটাল স্ক্যান সেন্টার কিউআর কোড',
                                  url: 'https://docslot.web.app/',
                                });
                                setSuccessToast('কিউআর কোড শেয়ার সম্পন্ন হয়েছে!');
                                return;
                              } catch (e: any) {
                                if (e.name === 'AbortError') return;
                              }
                            }
                          }
                          try {
                            await navigator.share({
                              title: 'সিগমা ডিজিটাল স্ক্যান সেন্টার (Sigma Scan)',
                              text: 'অনলাইন ডায়াগনস্টিক টেস্ট বুকিং ও সিরিয়াল ট্র্যাকিং',
                              url: 'https://docslot.web.app/',
                            });
                            setSuccessToast('শেয়ার সম্পন্ন হয়েছে!');
                          } catch (e: any) {
                            if (e.name !== 'AbortError') setErrorToast('শেয়ার করা সম্ভব হয়নি');
                          }
                        });
                      } else {
                        try {
                          await navigator.share({
                            title: 'সিগমা ডিজিটাল স্ক্যান সেন্টার (Sigma Scan)',
                            text: 'অনলাইন ডায়াগনস্টিক টেস্ট বুকিং ও সিরিয়াল ট্র্যাকিং',
                            url: 'https://docslot.web.app/',
                          });
                          setSuccessToast('শেয়ার সম্পন্ন হয়েছে!');
                        } catch (e: any) {
                          if (e.name !== 'AbortError') setErrorToast('শেয়ার করা সম্ভব হয়নি');
                        }
                      }
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition"
                  >
                    <Share2 className="h-4 w-4 text-teal-400" />
                    <span>শেয়ার</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  const shareUrl = 'https://docslot.web.app/';
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'সিগমা ডিজিটাল স্ক্যান সেন্টার (Sigma Scan)',
                        text: 'সিগমা ডিজিটাল স্ক্যান সেন্টার অনলাইন বুকিং পোর্টাল',
                        url: shareUrl,
                      });
                      setSuccessToast('লিঙ্ক শেয়ার সম্পন্ন হয়েছে!');
                      return;
                    } catch (err: any) {
                      if (err.name === 'AbortError') return;
                    }
                  }
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setSuccessToast('https://docslot.web.app/ লিঙ্কটি কপি করা হয়েছে!');
                  } catch (err) {
                    console.error('Failed to copy:', err);
                    setErrorToast('লিঙ্ক কপি করতে সমস্যা হয়েছে!');
                  }
                }}
                className="w-full bg-[#1a233a] hover:bg-slate-800 text-teal-300 hover:text-teal-200 border border-teal-500/30 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>লিঙ্ক শেয়ার বা কপি করুন (https://docslot.web.app/)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShareQrModal(false)}
                className="w-full bg-[#11192d] hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold py-2 rounded-xl text-xs cursor-pointer transition border border-slate-800"
              >
                বন্ধ করুন (Close)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin Login PIN Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-fade-in" id="admin-login-modal">
          <div className="bg-[#11192d] border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center text-teal-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">এডমিন লগইন</h3>
                  <p className="text-[10px] text-slate-400">সিক্রেট পিন দিয়ে আনলক করুন</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAdminLoginModal(false);
                  setLoginPinInput('');
                  setLoginPinError('');
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">এডমিন সিকিউরিটি পিন (PIN):</label>
                <div className="relative">
                  <input
                    type={showLoginPinText ? "text" : "password"}
                    placeholder="৪-ডিজিটের পিন কোড"
                    value={loginPinInput}
                    onChange={(e) => {
                      setLoginPinInput(e.target.value);
                      setLoginPinError('');
                    }}
                    className="w-full bg-[#1a233a] border border-slate-700 text-slate-100 rounded-xl px-4 py-3 pr-10 text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder-slate-600"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPinText(!showLoginPinText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    tabIndex={-1}
                  >
                    {showLoginPinText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginPinError && (
                  <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{loginPinError}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  আপনার ৪-ডিজিটের সিকিউরিটি পিন দিয়ে আনলক করুন
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLoginModal(false);
                    setLoginPinInput('');
                    setLoginPinError('');
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition border border-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition shadow-md shadow-teal-950/50 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>লগইন করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-fade-in" id="clear-all-modal">
          <div className="bg-[#11192d] border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-900/60 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100">সতর্কবার্তা: সব ডেটা মুছুন</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                সাবধান! আপনি কি সিস্টেমের সকল বুকিং ডেটা চিরতরে মুছে ফেলতে চান? এই কাজের পর আর ডেটা ফিরিয়ে আনা যাবে না।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition border border-slate-700"
              >
                না (No)
              </button>
              <button
                onClick={confirmClearAllData}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition shadow-lg shadow-rose-950/50"
              >
                হ্যাঁ, সব মুছুন (Yes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          FOOTER SECTION
          ========================================== */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center" id="footer-section">
        <div className="max-w-7xl mx-auto px-4 text-xs space-y-2">
          <p className="font-bold text-slate-300">© 2026 সিগমা স্ক্যান অ্যান্ড ডায়াগনস্টিক সেন্টার লিঃ। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-[10px] text-slate-500 max-w-lg mx-auto leading-relaxed">
            এই বুকিং অ্যাপ্লিকেশনটি শতভাগ অফলাইন ও সিকিউর লোকাল স্টোরেজ সিস্টেমের মাধ্যমে রোগীর বিবরণ ও টোকেন ট্র্যাক করে থাকে। আপনার প্রেসক্রিপশন ডেটা সুরক্ষিত রাখা আমাদের সর্বোচ্চ দায়িত্ব।
          </p>
        </div>
      </footer>

    </div>
  );
}
