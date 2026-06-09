'use client';

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SelfieCapture } from './SelfieCapture';
import { Loader2 } from 'lucide-react';

interface VisitorFormProps {
  token: string;
  onSubmitSuccess: () => void;
  isExpired: boolean;
}

interface FormErrors {
  nome?: string;
  documento?: string;
  foto?: string;
}

function validateNome(value: string): string | undefined {
  if (!value.trim()) return 'Nome é obrigatório.';
  if (value.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres.';
  if (value.trim().length > 120) return 'Nome deve ter no máximo 120 caracteres.';
  return undefined;
}

function validateDocumento(value: string): string | undefined {
  if (!value.trim()) return 'Documento é obrigatório.';

  const cleaned = value.replace(/[\s.\-/]/g, '');

  // CPF: exactly 11 digits
  if (/^\d{11}$/.test(cleaned)) return undefined;

  // RG: 5-14 alphanumeric characters
  if (/^[a-zA-Z0-9]{5,14}$/.test(cleaned)) return undefined;

  return 'Documento inválido. Informe CPF (11 dígitos) ou RG (5-14 caracteres).';
}

export function VisitorForm({ token, onSubmitSuccess, isExpired }: VisitorFormProps) {
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNome(value);
    if (touched.nome) {
      setErrors((prev) => ({ ...prev, nome: validateNome(value) }));
    }
  };

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDocumento(value);
    if (touched.documento) {
      setErrors((prev) => ({ ...prev, documento: validateDocumento(value) }));
    }
  };

  const handleBlur = (field: 'nome' | 'documento') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'nome') {
      setErrors((prev) => ({ ...prev, nome: validateNome(nome) }));
    } else {
      setErrors((prev) => ({ ...prev, documento: validateDocumento(documento) }));
    }
  };

  const handlePhotoCapture = useCallback((blob: Blob) => {
    setPhotoBlob(blob);
    setErrors((prev) => ({ ...prev, foto: undefined }));
  }, []);

  const handlePhotoClear = useCallback(() => {
    setPhotoBlob(null);
  }, []);

  const isFormValid = (): boolean => {
    const nomeError = validateNome(nome);
    const docError = validateDocumento(documento);
    return !nomeError && !docError && photoBlob !== null && !isExpired;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Run full validation
    const nomeError = validateNome(nome);
    const docError = validateDocumento(documento);
    const fotoError = !photoBlob ? 'Foto é obrigatória.' : undefined;

    setErrors({ nome: nomeError, documento: docError, foto: fotoError });
    setTouched({ nome: true, documento: true });

    if (nomeError || docError || fotoError || isExpired) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('name', nome.trim());
      formData.append('document', documento.replace(/[\s.\-/]/g, ''));
      formData.append('token', token);
      formData.append('photo', photoBlob!, 'selfie.jpg');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/visitor/register`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 410) {
          setSubmitError('Este convite expirou.');
        } else if (response.status === 413) {
          setSubmitError('Imagem muito grande. Tamanho máximo: 10MB.');
        } else if (response.status === 400) {
          setSubmitError(data?.message || 'Dados inválidos. Verifique os campos.');
        } else {
          setSubmitError('Erro ao enviar registro. Tente novamente.');
        }
        return;
      }

      onSubmitSuccess();
    } catch {
      setSubmitError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome completo */}
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-base">
          Nome completo
        </Label>
        <Input
          id="nome"
          type="text"
          placeholder="Seu nome completo"
          value={nome}
          onChange={handleNomeChange}
          onBlur={() => handleBlur('nome')}
          className="min-h-[44px] text-base"
          maxLength={120}
          disabled={isExpired || isSubmitting}
          aria-invalid={!!errors.nome}
          aria-describedby={errors.nome ? 'nome-error' : undefined}
        />
        {errors.nome && touched.nome && (
          <p id="nome-error" className="text-sm text-destructive" role="alert">
            {errors.nome}
          </p>
        )}
      </div>

      {/* Documento */}
      <div className="space-y-2">
        <Label htmlFor="documento" className="text-base">
          Documento (CPF ou RG)
        </Label>
        <Input
          id="documento"
          type="text"
          placeholder="CPF ou RG"
          value={documento}
          onChange={handleDocumentoChange}
          onBlur={() => handleBlur('documento')}
          className="min-h-[44px] text-base"
          maxLength={14}
          disabled={isExpired || isSubmitting}
          aria-invalid={!!errors.documento}
          aria-describedby={errors.documento ? 'documento-error' : undefined}
        />
        {errors.documento && touched.documento && (
          <p id="documento-error" className="text-sm text-destructive" role="alert">
            {errors.documento}
          </p>
        )}
      </div>

      {/* Selfie */}
      <div className="space-y-2">
        <Label className="text-base">Foto (selfie)</Label>
        <SelfieCapture
          onCapture={handlePhotoCapture}
          onClear={handlePhotoClear}
          hasPhoto={photoBlob !== null}
        />
        {errors.foto && (
          <p className="text-sm text-destructive" role="alert">
            {errors.foto}
          </p>
        )}
      </div>

      {/* Expired warning */}
      {isExpired && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" role="alert">
          Este link expirou. Não é possível enviar o formulário.
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" role="alert">
          {submitError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={!isFormValid() || isSubmitting}
        className="w-full min-h-[44px] text-base"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar registro'
        )}
      </Button>
    </form>
  );
}
