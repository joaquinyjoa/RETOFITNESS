export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  edad: number;
  correo: string;
  contraseña: string;
  enfermedadCronica: boolean;
  descripcionEnfermedad?: string;
  diabetes: boolean;
  hipotension: boolean;
  hipotiroide: boolean;
  hipotiroidismo: boolean;
  medicacionRegular: boolean;
  descripcionMedicacion?: string;
  cirugias: boolean;
  descripcionCirugias?: string;
  lesiones: boolean;
  descripcionLesiones?: string;
  fuma: boolean;
  alcohol: boolean;
  horasSueño: string;
  peso: number;
  objetivo: string;
  altura: number;
  nivelActividad?: 'Bajo' | 'Medio' | 'Alto';
  genero?: 'M' | 'F';
  qr: string;
}
