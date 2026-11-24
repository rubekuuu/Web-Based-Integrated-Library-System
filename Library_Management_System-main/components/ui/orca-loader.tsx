export function OrcaLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="orca-loader" role="status" aria-label={label}>
      <div className="orca-porthole">
        <div className="orca-orbit">
          <div className="orca-body">
            <div className="orca-dorsal" />
            <div className="orca-head" />
            <div className="orca-eye-patch" />
            <div className="orca-belly" />
            <div className="orca-saddle" />
            <div className="orca-pectoral" />
            <div className="orca-tail">
              <div className="orca-fluke" />
            </div>
          </div>
        </div>

        <div className="orca-splash" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="orca-waves" aria-hidden="true">
          <div className="wave wave-back" />
          <div className="wave wave-front" />
        </div>
      </div>
    </div>
  )
}
