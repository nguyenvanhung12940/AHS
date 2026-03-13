import React, { useEffect, useState } from 'react';
import { 
  DoorOpen, 
  Plus, 
  Users, 
  Bed, 
  MoreVertical,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Room, Student } from '../types';
import { useAuth } from '../AuthContext';

export const DormRooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    room_number: '',
    capacity: 8
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [roomsRes, studentsRes] = await Promise.all([
      fetch('/api/rooms'),
      fetch('/api/students')
    ]);
    setRooms(await roomsRes.json());
    setStudents(await studentsRes.json());
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setIsModalOpen(false);
      setFormData({ room_number: '', capacity: 8 });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Phòng Ký túc xá</h1>
          <p className="text-slate-500">Quản lý sức chứa và phân bổ sinh viên vào phòng.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-100"
          >
            <Plus className="w-5 h-5" />
            Thêm Phòng
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const roomStudents = students.filter(s => s.room_id === room.id);
            const occupancyRate = (room.current_students / room.capacity) * 100;
            
            return (
              <div key={room.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <DoorOpen className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      room.current_students >= room.capacity ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {room.current_students >= room.capacity ? 'Đã đầy' : 'Còn trống'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Phòng {room.room_number}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {room.current_students} Sinh viên
                    </div>
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      {room.capacity - room.current_students} Giường trống
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Đang ở</span>
                      <span className="text-slate-900">{Math.round(occupancyRate)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          occupancyRate > 90 ? 'bg-rose-500' : occupancyRate > 70 ? 'bg-orange-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="flex -space-x-2 overflow-hidden">
                    {roomStudents.slice(0, 5).map((student) => (
                      <div 
                        key={student.id}
                        title={student.name}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white"
                      >
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {roomStudents.length > 5 && (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 text-[10px] font-bold text-slate-600">
                        +{roomStudents.length - 5}
                      </div>
                    )}
                    {roomStudents.length === 0 && (
                      <span className="text-xs text-slate-400 italic">Chưa có sinh viên</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Thêm Phòng KTX mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số phòng</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="VD: 104"
                    value={formData.room_number}
                    onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sức chứa tối đa</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-100"
                >
                  Thêm Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
