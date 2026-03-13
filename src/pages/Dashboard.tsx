import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  DoorOpen, 
  Bed, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DashboardStats } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    insideStudents: 0,
    outsideStudents: 0,
    totalRooms: 0,
    roomsWithBeds: 0,
    lateToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listeners for stats
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const students = snapshot.docs.map(doc => doc.data());
      const total = students.length;
      const inside = students.filter(s => s.status === 'Inside').length;
      const outside = students.filter(s => s.status === 'Outside').length;
      
      setStats(prev => ({
        ...prev,
        totalStudents: total,
        insideStudents: inside,
        outsideStudents: outside
      }));
      setLoading(false);
    });

    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const rooms = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        totalRooms: rooms.length,
        roomsWithBeds: rooms.filter(r => r.status === 'Available').length // Simplified
      }));
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unsubLogs = onSnapshot(
      query(collection(db, 'logs'), where('status', '==', 'Late'), where('timestamp', '>=', today)),
      (snapshot) => {
        setStats(prev => ({
          ...prev,
          lateToday: snapshot.size
        }));
      }
    );

    return () => {
      unsubStudents();
      unsubRooms();
      unsubLogs();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Tổng số Sinh viên', value: stats.totalStudents, icon: Users, color: 'bg-blue-500', trend: '+2% so với tháng trước', trendIcon: TrendingUp },
    { label: 'Đang trong KTX', value: stats.insideStudents, icon: UserCheck, color: 'bg-emerald-500', trend: 'Lượng người hiện tại', trendIcon: TrendingUp },
    { label: 'Đang ngoài KTX', value: stats.outsideStudents, icon: UserMinus, color: 'bg-orange-500', trend: 'Dự kiến về trước 22:00', trendIcon: Clock },
    { label: 'Tổng số Phòng', value: stats.totalRooms, icon: DoorOpen, color: 'bg-indigo-500', trend: 'Tất cả các khu', trendIcon: TrendingUp },
    { label: 'Giường trống', value: stats.roomsWithBeds, icon: Bed, color: 'bg-cyan-500', trend: 'Sẵn sàng xếp phòng', trendIcon: TrendingUp },
    { label: 'Về muộn hôm nay', value: stats.lateToday, icon: Clock, color: 'bg-rose-500', trend: '-5% so với hôm qua', trendIcon: TrendingDown },
  ];

  const occupancyData = [
    { name: 'Trong KTX', value: stats.insideStudents },
    { name: 'Ngoài KTX', value: stats.outsideStudents },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  const weeklyData = [
    { name: 'T2', inside: 450, late: 12 },
    { name: 'T3', inside: 462, late: 8 },
    { name: 'T4', inside: 448, late: 15 },
    { name: 'T5', inside: 455, late: 10 },
    { name: 'T6', inside: 430, late: 25 },
    { name: 'T7', inside: 380, late: 40 },
    { name: 'CN', inside: 410, late: 20 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan Bảng điều khiển</h1>
        <p className="text-slate-500">Chào mừng trở lại hệ thống quản lý ký túc xá.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={card.color + " p-3 rounded-xl text-white shadow-lg"}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <card.trendIcon className="w-3 h-3" />
                {card.trend}
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{card.label}</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Phân bố Trạng thái Sinh viên</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Hoạt động Điểm danh Hàng tuần</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="bottom" height={36}/>
                <Bar dataKey="inside" name="Đúng giờ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Về muộn" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
