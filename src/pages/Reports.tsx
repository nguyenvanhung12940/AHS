import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  DoorOpen, 
  History, 
  AlertCircle,
  Download,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const reportTypes = [
    { id: 'students', label: 'Danh sách Sinh viên', description: 'Danh sách đầy đủ tất cả sinh viên nội trú cùng thông tin liên hệ.', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'occupancy', label: 'Tình trạng Phòng', description: 'Chi tiết về việc sử dụng phòng và sức chứa còn trống.', icon: DoorOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'activity', label: 'Nhật ký Hoạt động Tháng', description: 'Tất cả hồ sơ ra/vào trong tháng hiện tại.', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'late', label: 'Tổng hợp Về muộn', description: 'Tóm tắt các vi phạm giờ giới nghiêm và thói quen về muộn.', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const handleExport = async (type: string) => {
    let endpoint = '';
    let filename = '';
    
    switch(type) {
      case 'students': endpoint = '/api/students'; filename = 'student_list'; break;
      case 'occupancy': endpoint = '/api/rooms'; filename = 'room_occupancy'; break;
      case 'activity': endpoint = '/api/logs'; filename = 'activity_log'; break;
      case 'late': endpoint = '/api/reports/late'; filename = 'late_returns'; break;
    }

    const res = await fetch(endpoint);
    const data = await res.json();
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map((obj: any) => headers.map(header => JSON.stringify(obj[header] ?? '')));
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`);
      link.click();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trung tâm Báo cáo</h1>
        <p className="text-slate-500">Tạo và xuất các báo cáo quản lý ký túc xá chi tiết.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <div 
            key={report.id}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            onClick={() => handleExport(report.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className={`${report.bg} ${report.color} p-4 rounded-2xl`}>
                  <report.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{report.label}</h3>
                  <p className="text-sm text-slate-500 mt-1">{report.description}</p>
                </div>
              </div>
              <div className="p-2 text-slate-300 group-hover:text-blue-600 transition-colors">
                <Download className="w-5 h-5" />
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Tạo lần cuối: Hôm nay</span>
              <div className="flex items-center gap-1 text-blue-600">
                Nhấn để Xuất
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Cần báo cáo tùy chỉnh?</h2>
          <p className="text-blue-100 max-w-md">
            Đội ngũ quản trị của chúng tôi có thể giúp bạn tạo các báo cáo chuyên biệt cho các ngày hoặc tiêu chí cụ thể.
          </p>
          <button className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-50 transition-colors">
            Liên hệ Hỗ trợ
          </button>
        </div>
        <FileText className="absolute -right-8 -bottom-8 w-64 h-64 text-blue-500/20 rotate-12" />
      </div>
    </div>
  );
};
