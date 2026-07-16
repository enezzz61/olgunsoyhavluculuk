"use client";

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
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

interface AddressSelectorProps {
  onAddressSelected: (address: Address) => void;
}

export const AddressSelector = forwardRef<{ reload: () => void }, AddressSelectorProps>(
  ({ onAddressSelected }, ref) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

    const loadAddresses = useCallback(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/addresses");
        const data = await response.json();
        if (data.addresses) {
          setAddresses(data.addresses);
          // Auto-select default address
          const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
          if (defaultAddr) {
            setSelectedId(defaultAddr.id);
            onAddressSelected(defaultAddr);
          }
        }
      } catch {
        setMessage("Adresler yuklenmedi");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }, [onAddressSelected]);

    useImperativeHandle(ref, () => ({
      reload: loadAddresses,
    }));

    useEffect(() => {
      loadAddresses();
    }, [loadAddresses]);

  function handleSelect(address: Address) {
    setSelectedId(address.id);
    onAddressSelected(address);
  }

  if (loading) return <div>Yukleniyor...</div>;

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Teslimat Adresi</h3>
        
        {addresses.length === 0 ? (
          <p className="text-gray-500">Adres bulunamadi. Lutfen <a href="/hesap" className="text-blue-600 hover:underline">hesaptan adres ekleyin</a>.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <label key={address.id} className="flex items-start border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === address.id}
                  onChange={() => handleSelect(address)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <p className="font-semibold">{address.fullName}</p>
                  <p className="text-sm text-gray-600">{address.phone}</p>
                  <p className="text-sm">
                    {address.address}, {address.district}/{address.city} {address.postalCode && ` ${address.postalCode}`}
                  </p>
                  {address.isDefault && <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">Varsayilan</span>}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
      <AppToast message={message} type={messageType} onClose={() => setMessage("")} />
    </>
  );
  }
);

AddressSelector.displayName = "AddressSelector";
