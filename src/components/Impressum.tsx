export function Impressum({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Impressum</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-gray-700">
          <section>
            <h3 className="font-semibold text-gray-900 mb-1">Angaben gemäß § 5 DDG</h3>
            <p>
              Maximilian Link<br />
              Graf-Konrad-Str. 10<br />
              76229 Karlsruhe
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">Kontakt</h3>
            <p>E-Mail: website@mxlink.de</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-1">Datenschutzerklärung</h3>
            <p>
              Diese Website wird über GitHub Pages (GitHub Inc., 88 Colin P Kelly Jr St,
              San Francisco, CA 94107, USA) bereitgestellt. Beim Zugriff auf die Website
              werden durch den Hosting-Anbieter automatisch Verbindungsdaten (z.&nbsp;B.
              IP-Adresse) verarbeitet. Nähere Informationen finden Sie in der{' '}
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Datenschutzerklärung von GitHub
              </a>.
            </p>
            <p className="mt-2">
              Die Anwendung selbst speichert alle Daten ausschließlich lokal in Ihrem
              Browser (LocalStorage). Es werden keine Daten an einen Server übertragen,
              keine Cookies gesetzt und keine Analyse- oder Tracking-Tools eingesetzt.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-gray-900 mb-1">Open-Source-Lizenzen</h3>
            <p>
              Diese Anwendung verwendet Open-Source-Software.{' '}
              <a
                href={import.meta.env.BASE_URL + 'licenses.txt'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Lizenzhinweise Dritter anzeigen
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
