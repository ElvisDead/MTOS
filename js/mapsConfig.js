export const MTOS_MAPS = {

pressure: () => pyodide.runPython(`mtos_pressure_map()`).toJs(),

gradient: () => pyodide.runPython(`mtos_pressure_gradient()`).toJs(),

atlas: () => pyodide.runPython(`mtos_climate_atlas()`).toJs(),

attractor: () => pyodide.runPython(`mtos_attractor_map(name,year,month,day)`).toJs(),

phase: () => pyodide.runPython(`mtos_phase_matrix()`).toJs(),

wave: () => pyodide.runPython(`mtos_wave_structure()`).toJs(),

tzolkin: () => pyodide.runPython(`mtos_tzolkin_structure()`).toJs(),

}
