import React, { useEffect, useState } from 'react';
import { AlertCircle, Search, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface LateReport {
  check_in_time: string;
  student_name: string;
  class: string;
  room_number: string;
}

export const LateReturnReport: React.FC = () => {
  const [reports, setReports] = useState<LateReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/reports/late')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      });
  }, []);

  const filteredReports = reports.filter(r => 
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.room_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Tên Sinh viên', 'Lớp', 'Phòng', 'Giờ vào'];
    const rows = filteredReports.map(r => [
      r.student_name,
      r.class,
      r.room_number,
      format(new Date(r.check_in_time), 'yyyy-MM-dd HH:mm:ss')
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `late_return_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo Về muộn</h1>
          <p className="text-slate-500">Sinh viên điểm danh vào KTX sau giờ giới nghiêm (22:00).</p>
        </div>
        <button 
          onClick={exportCSV}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="w-5 h-5" />
          Xuất CSV
        </button>
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-rose-900 font-bold">Quy định Giờ giới nghiêm</h3>
          <p className="text-rose-700 text-sm mt-1">
            Tất cả sinh viên nội trú phải có mặt trong ký túc xá trước 22:00. Bất kỳ lượt điểm danh vào nào sau thời gian này sẽ tự động bị đánh dấu là về muộn để ban quản lý xem xét.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên sinh viên hoặc phòng..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600">
            <Calendar className="w-5 h-5" />
            Tháng này
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên Sinh viên</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phòng</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Giờ vào</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trễ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Không có ghi nhận về muộn nào.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, idx) => {
                  const checkIn = new Date(report.check_in_time);
                  const curfew = new Date(report.check_in_time);
                  curfew.setHours(22, 0, 0, 0);
                  const diffMs = checkIn.getTime() - curfew.getTime();
                  const diffMins = Math.floor(diffMs / (1000 * 60));
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{report.student_name}</td>
                      <td className="px-6 py-4 text-slate-600">{report.class}</td>
                      <td className="px-6 py-4 text-slate-600">Phòng {report.room_number}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{format(checkIn, 'dd/MM/yyyy')}</p>
                        <p className="text-xs text-rose-600 font-bold">{format(checkIn, 'HH:mm:ss')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-rose-600">+{diffMins} phút</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
