"use client";

import { useState, useEffect } from "react";
import { AppToast } from "@/components/app-toast";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  postalCode?: string;
  isDefault: boolean;
};

export function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      const response = await fetch("/api/addresses");
      const data = await response.json();
      if (data.addresses) {
        setAddresses(data.addresses);
      }
    } catch {
      setMessage("Adresler yuklenmedi");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.city || !formData.district || !formData.address) {
      setMessage("Tum alanlar zorunludur");
      setMessageType("error");
      return;
    }

    try {
      let response;

      if (editingId) {
        response = await fetch(`/api/addresses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        setMessage("Islem basarisiz oldu");
        setMessageType("error");
        return;
      }

      setMessage(editingId ? "Adres guncellendi" : "Adres eklendi");
      setMessageType("success");
      resetForm();
      loadAddresses();
    } catch {
      setMessage("Hata olustu");
      setMessageType("error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Adresi silmek istediginizden emin misiniz?")) return;

    try {
      const response = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (response.ok) {
        setMessage("Adres silindi");
        setMessageType("success");
        loadAddresses();
      } else {
        setMessage("Silme basarisiz oldu");
        setMessageType("error");
      }
    } catch {
      setMessage("Hata olustu");
      setMessageType("error");
    }
  }

  function resetForm() {
    setFormData({
      fullName: "",
      phone: "",
      city: "",
      district: "",
      address: "",
      postalCode: "",
      isDefault: false,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(address: Address) {
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      city: address.city,
      district: address.district,
      address: address.address,
      postalCode: address.postalCode || "",
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  }

  if (loading) return <div>Yukleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Adreslerim</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Yeni Adres Ekle
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Ad Soyad"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="tel"
              placeholder="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Il"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Ilce"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Posta Kodu (Opsiyonel)"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <textarea
            placeholder="Adres"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="border rounded px-3 py-2 w-full"
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
            Varsayilan Adres Olarak Ayarla
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {editingId ? "Guncelle" : "Ekle"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Iptal
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <p className="text-gray-500">Henuz adres eklemediniz</p>
        ) : (
          addresses.map((address) => (
            <div key={address.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{address.fullName}</h3>
                  <p className="text-sm text-gray-600">{address.phone}</p>
                  {address.isDefault && <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">Varsayilan</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-blue-600 hover:underline"
                  >
                    Duzenle
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-red-600 hover:underline"
                  >
                    Sil
                  </button>
                </div>
              </div>
              <p className="text-sm">
                {address.address}, {address.district}/{address.city} {address.postalCode && ` ${address.postalCode}`}
              </p>
            </div>
          ))
        )}
      </div>
      <AppToast message={message} type={messageType} onClose={() => setMessage("")} />
    </div>
  );
}
