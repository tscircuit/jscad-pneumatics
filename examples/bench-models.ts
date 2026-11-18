export const benchModels = {
  solenoid: [
    "Round inline 3/2 solenoid valve",
    "airdirectionalvalve_flow(3/2)_round_solenoid_springreturn_normallyclosed_ventedcap_radialleads_l27.74mm_w22.22mm_h39.6mm_portheight4.78mm_coilod22.22mm_port(10-32)",
    "Clippard EV-3-12 exterior and port orientation",
  ],
  "block-solenoid": [
    "Block 5/2 valve",
    "airdirectionalvalve_flow(5/2)_block_solenoid_springreturn_l60mm_w22mm_h28mm_mountpitch49mm_port(1/8npt)",
    "Generic block housing and five connection points",
  ],
  "straight-fitting": [
    "Straight male push fitting",
    "pushfitting_straight_male_tubeod0.25in_thread(10-32)_l22.38mm_bodyod12.7mm_hexaf12.7mm_threadl3.43mm",
    "Clippard PQ-MC08N-PKG exterior",
  ],
  "elbow-fitting": [
    "Male threaded elbow fitting",
    "pushfitting_elbow_male_tubeod6mm_thread(1/8npt)_l37mm_branchl19mm",
    "Generic right-angle push fitting",
  ],
  "branch-tee": [
    "Male branch tee",
    "pushfitting_tee_male_tubeod0.25in_thread(1/4npt)_l39.88mm_bodyod16.5mm_branchl23.11mm_threadl8mm",
    "Clippard PQ-BT08Q-PKG exterior",
  ],
  "female-fitting": [
    "Straight female push fitting",
    "pushfitting_straight_female_tubeod6mm_thread(m5x0.8)",
    "Generic female threaded adapter",
  ],
  regulator: [
    "Axial-inlet compact regulator",
    "airregulator_axialradial_relieving_l63.87mm_w17.46mm_h17.46mm_knobOD10.79mm_knobL11.89mm_port(10-32)",
    "Clippard MAR-1 exterior",
  ],
  gauge: [
    "Back-mount pressure gauge",
    "pressuregauge_backmount_od41.275mm_depth27.11mm_steml16.66mm_range100_psi_reading10_port(1/8npt)_innerport(10-32)",
    "Clippard PG-101-BK exterior",
  ],
  pump: [
    "Brushed DC diaphragm pump",
    "diaphragmpump_brusheddc_l84.45mm_w30.5mm_h50.77mm_headl29.5mm_motorod30mm_hoseid4mm_barbpitch13mm_barbl13mm",
    "KNF NMP 830 brushed pump outline",
  ],
  relief: [
    "Relief valve with pressure gauge",
    "airreliefvalve_gauge_l42mm_w38mm_h75mm_knobod28mm_gaugeod40mm_port(1/4ptf)_gaugeport(1/8ptf)",
    "Norgren V07 outline from the dimensioned drawing",
  ],
  drain: [
    "Wing-handle drain valve",
    "airdrainvalve_wing_l0.92in_wingw1.25in_hexaf0.40625in_thread(1/8npt)",
    "Parker DC602-2 outline from the catalog drawing",
  ],
  tubing: [
    "Hollow routed tubing",
    "airtubing_od0.25in_id0.16in_path(0,0,0|20,0,0|35,6,3|44,18,7|45,36,11)",
    "6.35 mm outside diameter, 4.064 mm bore",
  ],
} as const
