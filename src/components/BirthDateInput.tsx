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

const monthsShort = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
        <div className="relative">
          <select
            value={month}
            onChange={(event) => {
              const nextMonth = event.target.value;
              setMonth(nextMonth);
              emit(day, nextMonth, year);
            }}
            className={`${fieldClass} appearance-none pr-8`}
            aria-label="Mes de nacimiento"
          >
            <option value="">Mes</option>
            {months.map((label, index) => {
              const value = String(index + 1).padStart(2, "0");
              return (
                <option key={value} value={value}>
                  {isMobile ? monthsShort[index] : label}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
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
