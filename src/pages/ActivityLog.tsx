import React, { useEffect, useState, useRef } from 'react';
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft,
  Filter,
  Clock,
  UserCheck,
  UserMinus,
  QrCode
} from 'lucide-react';
import { Log, Student } from '../types';
import { format } from 'date-fns';
import { QRScanner } from '../components/QRScanner';
import { io } from 'socket.io-client';

export const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isPhysicalScannerMode, setIsPhysicalScannerMode] = useState(true);

  // Refs for physical scanner
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    fetchData();

    // Setup WebSocket connection
    const socket = io();
    
    socket.on('scan_success', (data) => {
      // Show toast message
      setScanMessage({ 
        type: 'success', 
        text: `${data.action === 'Check-in' ? 'Vào' : 'Ra'} thành công cho ${data.student_name} (qua máy quét khác)` 
      });
      setTimeout(() => setScanMessage(null), 3000);
      
      // Refresh data to show new log
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Physical Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPhysicalScannerMode) return;

      // Ignore if user is typing in an input field (like search)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keystrokes is > 50ms, it's likely human typing, so clear the buffer
      if (currentTime - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }
      
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          // Scanner finished reading
          handleScan(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        // Only add single characters (ignore Shift, Ctrl, etc.)
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPhysicalScannerMode, students]); // Need students in dependency array for handleScan to have latest data

  const fetchData = async () => {
    const [logsRes, studentsRes] = await Promise.all([
      fetch('/api/logs'),
      fetch('/api/students')
    ]);
    setLogs(await logsRes.json());
    setStudents(await studentsRes.json());
    setLoading(false);
  };

  const handleCheckInOut = async (studentId: string, action: 'Check-in' | 'Check-out') => {
    const response = await fetch('/api/check-in-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, action }),
    });

    if (response.ok) {
      fetchData();
      setIsCheckInOpen(false);
      return true;
    }
    return false;
  };

  const handleScan = async (decodedText: string) => {
    // decodedText could be student ID or QR Code ID
    const student = students.find(s => s.id === decodedText || s.qr_code_id === decodedText);
    
    if (student) {
      const action = student.status === 'Inside' ? 'Check-out' : 'Check-in';
      const success = await handleCheckInOut(student.id, action);
      
      if (success) {
        setScanMessage({ 
          type: 'success', 
          text: `${action === 'Check-in' ? 'Vào' : 'Ra'} thành công cho ${student.name}` 
        });
        setIsScannerOpen(false);
        setTimeout(() => setScanMessage(null), 3000);
      } else {
        setScanMessage({ type: 'error', text: 'Lỗi khi xử lý thao tác ra/vào' });
      }
    } else {
      setScanMessage({ type: 'error', text: 'Không tìm thấy sinh viên với mã QR này' });
    }
  };

  const filteredLogs = logs.filter(l => 
    l.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhật ký Hoạt động</h1>
          <p className="text-slate-500">Theo dõi sinh viên ra vào theo thời gian thực.</p>
        </div>
        <div className="flex gap-3">
          {isPhysicalScannerMode && (
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-medium animate-pulse">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Sẵn sàng nhận máy quét vật lý
            </div>
          )}
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-slate-200"
          >
            <QrCode className="w-5 h-5" />
            Quét mã QR (Camera)
          </button>
          <button 
            onClick={() => setIsCheckInOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-100"
          >
            <History className="w-5 h-5" />
            Thao tác nhanh
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className={`p-4 rounded-xl border ${
          scanMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
        } animate-in fade-in slide-in-from-top-4 duration-300`}>
          {scanMessage.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên hoặc mã SV..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600">
            <Filter className="w-5 h-5" />
            Lọc theo ngày
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sinh viên</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phòng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy nhật ký hoạt động nào.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{log.student_name}</p>
                        <p className="text-xs text-slate-500">ID: {log.student_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.action === 'Check-in' ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm">
                            <ArrowDownLeft className="w-4 h-4" />
                            Vào
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-orange-600 font-medium text-sm">
                            <ArrowUpRight className="w-4 h-4" />
                            Ra
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{format(new Date(log.timestamp), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-slate-500">{format(new Date(log.timestamp), 'HH:mm:ss')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        log.status === 'Normal' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {log.status === 'Normal' ? 'Bình thường' : log.status === 'Late' ? 'Về muộn' : log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-medium">Phòng {log.room_number}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Modal */}
      {isCheckInOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Điểm danh Nhanh</h3>
              <button onClick={() => setIsCheckInOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <History className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-6">Chọn sinh viên để ghi nhận ra/vào.</p>
              <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{student.name}</p>
                      <p className="text-xs text-slate-500">Phòng {student.room_number} • Hiện tại {student.status === 'Inside' ? 'Trong KTX' : student.status === 'Outside' ? 'Ngoài KTX' : student.status}</p>
                    </div>
                    <div className="flex gap-2">
                      {student.status === 'Inside' ? (
                        <button 
                          onClick={() => handleCheckInOut(student.id, 'Check-out')}
                          className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors"
                          title="Ra"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleCheckInOut(student.id, 'Check-in')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors"
                          title="Vào"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
};
