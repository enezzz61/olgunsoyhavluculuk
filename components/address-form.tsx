"use client";

import { useState } from "react";
import { AppToast } from "@/components/app-toast";

interface AddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddressForm({ onSuccess, onCancel }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
    district: "",
    address: "",
    postalCode: "",
    isDefault: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.city || !formData.district || !formData.address) {
      setMessage("Tum alanlar zorunludur");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setMessage("Adres eklenemedi");
        setMessageType("error");
        return;
      }

      setMessage("Adres basarıyla eklendi");
      setMessageType("success");
      onSuccess();
    } catch {
      setMessage("Hata olustudu");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Ad Soyad"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="tel"
            placeholder="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Il"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Ilce"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            className="border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Posta Kodu (Opsiyonel)"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            className="border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <textarea
          placeholder="Adres"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="border rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
          rows={3}
          required
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="mr-2"
          />
          <span>Varsayilan Adres Olarak Ayarla</span>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {loading ? "Kaydediliyor..." : "Adres Ekle"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
          >
            Iptal
          </button>
        </div>
      </form>
      <AppToast message={message} type={messageType} onClose={() => setMessage("")} />
    </>
  );
}
