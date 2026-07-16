"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-provider";
import { AddressSelector } from "@/components/address-selector";
import { AddressForm } from "@/components/address-form";

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

export default function PaymentPage() {
  const router = useRouter();
  const { user, cart } = useStore();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const addressSelectorRef = useRef<{ reload: () => void }>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ödeme için Giriş Yapmalısınız</h1>
          <button
            onClick={() => router.push("/hesap/giris")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
          <button
            onClick={() => router.push("/urunler")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Alışverişe Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Cart summary will show items; total is calculated on checkout
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  async function handleCheckout() {
    if (!selectedAddress) {
      alert("Lütfen teslimat adresini seçin");
      return;
    }

    setLoading(true);
    try {
      // Sepeti adres bilgisi ile gönder
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: cart,
          shippingAddressId: selectedAddress.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Ödeme başarısız");
        return;
      }

      const data = await response.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "Ödeme başarısız");
      }
    } catch {
      alert("İşlem sırasında hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Ödeme</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Adres Seçimi */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
              <AddressSelector 
                ref={addressSelectorRef}
                onAddressSelected={setSelectedAddress} 
              />

              {!selectedAddress && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 mb-4">
                    Henüz adres seçmediniz. Lütfen bir adres seçin veya yeni bir adres ekleyin.
                  </p>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {showAddressForm ? "Formu Kapat" : "Yeni Adres Ekle"}
                  </button>
                </div>
              )}

              {showAddressForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Yeni Adres Ekle</h3>
                  <AddressForm
                    onSuccess={() => {
                      setShowAddressForm(false);
                      addressSelectorRef.current?.reload();
                    }}
                    onCancel={() => setShowAddressForm(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sipariş Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
              <h2 className="text-xl font-bold mb-4">Sipariş Özeti</h2>

              <div className="space-y-3 border-b pb-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Ürün Sayısı:</span>
                  <span className="font-semibold">{itemCount} adet</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold">Toplam:</span>
                <span className="text-2xl font-bold text-blue-600">Hesaplanıyor...</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!selectedAddress || loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? "İşleniyor..." : "Ödemeye Devam Et"}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Adres seçtikten sonra ödeme yapabilirsiniz
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
