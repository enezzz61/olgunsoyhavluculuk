"use client";

type PaymentMethod = "credit-card" | "bank-transfer";

type Props = {
  selectedMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
};

export function PaymentMethodSelector({ selectedMethod, onSelect }: Props) {
  const methods: Array<{ value: PaymentMethod; label: string; description: string }> = [
    {
      value: "credit-card",
      label: "Kredi Kartı",
      description: "İframe üzerinden güvenli ödeme",
    },
    {
      value: "bank-transfer",
      label: "Havale / EFT",
      description: "Ödeme bilgileri manuel paylaşılır",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Ödeme Yöntemi</h3>
      <div className="grid gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.value;
          return (
            <label
              key={method.value}
              className={`flex cursor-pointer items-start rounded-xl border p-4 transition ${isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
            >
              <input
                type="radio"
                name="payment-method"
                className="mt-1 mr-3"
                checked={isSelected}
                onChange={() => onSelect(method.value)}
              />
              <div>
                <p className="font-semibold text-slate-800">{method.label}</p>
                <p className="text-sm text-slate-600">{method.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
