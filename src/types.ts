export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher';
  name: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  room_id: number;
  room_number?: string;
  phone: string;
  parent_phone: string;
  status: 'Inside' | 'Outside' | 'Late';
  qr_code_id: string;
}

export interface Room {
  id: number;
  room_number: string;
  capacity: number;
  current_students: number;
  status: 'Available' | 'Full';
}

export interface Log {
  id: number;
  student_id: string;
  student_name: string;
  room_number: string;
  action: 'Check-in' | 'Check-out';
  timestamp: string;
  status: 'Normal' | 'Late';
}

export interface DashboardStats {
  totalStudents: number;
  insideStudents: number;
  outsideStudents: number;
  totalRooms: number;
  roomsWithBeds: number;
  lateToday: number;
}
