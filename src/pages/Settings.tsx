import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Globe } from 'lucide-react';

export const Settings: React.FC = () => {
  const sections = [
    { icon: User, label: 'Cài đặt Hồ sơ', desc: 'Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.' },
    { icon: Bell, label: 'Thông báo', desc: 'Cấu hình cách bạn nhận cảnh báo về việc về muộn và điểm danh.' },
    { icon: Shield, label: 'Kiểm soát Truy cập', desc: 'Quản lý vai trò người dùng và quyền hệ thống cho nhân viên.' },
    { icon: Database, label: 'Sao lưu Hệ thống', desc: 'Xuất bản sao lưu cơ sở dữ liệu và quản lý việc lưu giữ dữ liệu.' },
    { icon: Globe, label: 'Cài đặt Chung', desc: 'Thay đổi ngôn ngữ hệ thống, múi giờ và thông tin trường học.' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="text-slate-500">Cấu hình tùy chọn hệ thống và quản lý tài khoản của bạn.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {sections.map((section, idx) => (
            <div key={idx} className="p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="p-3 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <section.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{section.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{section.desc}</p>
              </div>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Cấu hình
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="px-6 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 font-semibold">
          Hủy thay đổi
        </button>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-100 font-semibold">
          Lưu tất cả Cài đặt
        </button>
      </div>
    </div>
  );
};
