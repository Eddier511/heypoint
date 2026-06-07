import { useEffect, useState } from "react";

type BirthDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
};

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function parseBirthDate(value: string) {
  const trimmed = String(value || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-");
    return { day, month, year };
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return {
      day: day.padStart(2, "0"),
      month: month.padStart(2, "0"),
      year,
    };
  }

  return { day: "", month: "", year: "" };
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function toDisplayDate(day: string, month: string, year: string) {
  if (!day || !month || year.length !== 4) return "";
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

export function BirthDateInput({
  value,
  onChange,
  hasError = false,
}: BirthDateInputProps) {
  const parsed = parseBirthDate(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const next = parseBirthDate(value);
    if (!value) return;
    if (value && next.day !== day) setDay(next.day);
    if (value && next.month !== month) setMonth(next.month);
    if (value && next.year !== year) setYear(next.year);
  }, [value]);

  const emit = (nextDay: string, nextMonth: string, nextYear: string) => {
    onChange(toDisplayDate(nextDay, nextMonth, nextYear));
  };

  const fieldClass = [
    "w-full rounded-2xl border-2 bg-white px-3 py-4 text-base text-[#1C2335] outline-none transition-all placeholder:text-gray-400 focus:ring-4",
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20",
  ].join(" ");

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#2E2E2E]/70">
          Día
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={day}
          placeholder="01"
          maxLength={2}
          onChange={(event) => {
            const nextDay = onlyDigits(event.target.value, 2);
            setDay(nextDay);
            emit(nextDay, month, year);
          }}
          className={fieldClass}
          aria-label="Día de nacimiento"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#2E2E2E]/70">
          Mes
        </label>
        <select
          value={month}
          onChange={(event) => {
            const nextMonth = event.target.value;
            setMonth(nextMonth);
            emit(day, nextMonth, year);
          }}
          className={fieldClass}
          aria-label="Mes de nacimiento"
        >
          <option value="">Mes</option>
          {months.map((label, index) => {
            const value = String(index + 1).padStart(2, "0");
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#2E2E2E]/70">
          Año
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={year}
          placeholder="1990"
          maxLength={4}
          onChange={(event) => {
            const nextYear = onlyDigits(event.target.value, 4);
            setYear(nextYear);
            emit(day, month, nextYear);
          }}
          className={fieldClass}
          aria-label="Año de nacimiento"
        />
      </div>
    </div>
  );
}
