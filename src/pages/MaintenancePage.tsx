export function MaintenancePage() {
  return (
    <main className="min-h-screen bg-[#FFF4E6] px-6 py-12 flex items-center justify-center">
      <div className="w-full max-w-xl text-center">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/heymarket-35d03.firebasestorage.app/o/images%2FHeypoint-header-logo-100x60-orange.svg?alt=media&token=9ee36f7e-ee0d-4dba-9d7b-3af1688b8f94"
          alt="Hey!Point"
          className="mx-auto mb-10 h-[60px] w-auto"
        />
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1C2335] mb-5">
          Estamos haciendo una pausa
        </h1>
        <p className="text-lg text-[#2E2E2E] leading-relaxed mb-3">
          Estamos realizando tareas de mantenimiento para que puedas seguir comprando con normalidad.
        </p>
        <p className="text-[#555]">Volvé a intentarlo en unos minutos.</p>
      </div>
    </main>
  );
}
