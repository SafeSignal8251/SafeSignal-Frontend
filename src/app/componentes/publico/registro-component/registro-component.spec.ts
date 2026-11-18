import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegistroComponent } from './registro-component';

// Pruebas de las validaciones del formulario de registro (HU-01 y HU-45)
describe('RegistroComponent', () => {
  let comp: RegistroComponent;

  const valido = {
    nombreCompleto: 'Ana Pérez Ramos',
    correo: 'ana@correo.com',
    dni: '12345678',
    telefono: '987654321',
    distrito: 'Miraflores',
    contrasena: 'Clave12345',
    confirmar: 'Clave12345',
    aceptaTerminos: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    comp = TestBed.createComponent(RegistroComponent).componentInstance;
  });

  it('un formulario completo es válido', () => {
    comp.registroForm.setValue(valido);
    expect(comp.registroForm.valid).toBe(true);
  });

  it('exige aceptar los términos y condiciones (HU-45)', () => {
    comp.registroForm.setValue({ ...valido, aceptaTerminos: false });
    expect(comp.registroForm.valid).toBe(false);
    expect(comp.registroForm.get('aceptaTerminos')?.hasError('required')).toBe(true);
  });

  it('rechaza un DNI que no tenga 8 dígitos', () => {
    comp.registroForm.setValue({ ...valido, dni: '1234' });
    expect(comp.registroForm.get('dni')?.invalid).toBe(true);
  });

  it('rechaza una contraseña de menos de 8 caracteres', () => {
    comp.registroForm.setValue({ ...valido, contrasena: 'corta', confirmar: 'corta' });
    expect(comp.registroForm.get('contrasena')?.invalid).toBe(true);
  });

  it('rechaza si las contraseñas no coinciden', () => {
    comp.registroForm.setValue({ ...valido, confirmar: 'OtraClave123' });
    expect(comp.registroForm.hasError('noCoinciden')).toBe(true);
  });

  it('rechaza un correo sin formato válido', () => {
    comp.registroForm.setValue({ ...valido, correo: 'no-es-correo' });
    expect(comp.registroForm.get('correo')?.invalid).toBe(true);
  });

  it('el nombre completo debe tener al menos nombre y apellido', () => {
    comp.registroForm.setValue({ ...valido, nombreCompleto: 'Ana' });
    expect(comp.registroForm.get('nombreCompleto')?.invalid).toBe(true);
  });
});
