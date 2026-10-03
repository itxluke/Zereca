/** Actual repaired skin driver. Use this OR the embedded clip, never both. */
import {Quaternion, Vector3, type Object3D} from 'three';

export const UNWRITTEN_RIG = {
  "url": "/assets/unwritten-repaired-idle.glb",
  "nativeHeight": 0.9778441786766052,
  "targetHeight": 1.85,
  "scaleForTargetHeight": 1.8919169902801514,
  "idleClip": "Unwritten_BreathAndOffer",
  "envelopeNode": "Invitation_Envelope",
  "suspensionNode": "EnvelopeSuspension",
  "front": "+Z",
  "up": "+Y",
  "restBounds": {
    "min": [
      -0.3243408203125,
      0.0,
      -0.3128509521484375
    ],
    "max": [
      0.3243408203125,
      0.9778441786766052,
      0.3128509521484375
    ]
  },
  "anchors": {
    "R_HandWrist": [
      -0.15047122538089752,
      0.6811271905899048,
      0.20236922800540924
    ],
    "R_PalmSurface": [
      -0.16748704,
      0.67106283,
      0.30271286
    ],
    "R_ThreadPinch": [
      -0.20675240457057953,
      0.6803532838821411,
      0.2683701813220978
    ],
    "L_HandWrist": [
      0.2612885534763336,
      0.5382788181304932,
      -0.0837806835770607
    ],
    "L_HandSurface": [
      0.25437507,
      0.48405406,
      -0.01108894
    ],
    "EnvelopeSeal": [
      -0.21487551927566528,
      0.5487433075904846,
      0.27677834033966064
    ],
    "EnvelopeSealSurface": [
      -0.22024381,
      0.54906601,
      0.2828306
    ],
    "CollarOpeningCenter": [
      0.074,
      0.963,
      -0.018
    ],
    "TorsoCenter": [
      0.07066462934017181,
      0.7543917298316956,
      -0.01718870736658573
    ]
  }
} as const;

export const UNWRITTEN_ANCHOR_BINDINGS = {
  "R_HandWrist": {
    "node": "R_Hand",
    "local": [
      -4.163336342344337e-17,
      0.0,
      -4.163336342344337e-17
    ]
  },
  "R_PalmSurface": {
    "node": "R_Hand",
    "local": [
      -0.00444981866420513,
      0.09194783027790288,
      0.04455860639812248
    ]
  },
  "R_ThreadPinch": {
    "node": "EnvelopeSuspension",
    "local": [
      0.0,
      0.0,
      0.0
    ]
  },
  "L_HandWrist": {
    "node": "L_Hand",
    "local": [
      2.7755575615628914e-17,
      -9.71445146547012e-17,
      -2.7755575615628914e-17
    ]
  },
  "L_HandSurface": {
    "node": "L_Hand",
    "local": [
      0.062334368809313076,
      0.06520839640429764,
      -0.011597488343847578
    ]
  },
  "EnvelopeSeal": {
    "node": "Invitation_Envelope",
    "local": [
      -0.008123114705085754,
      -0.1316099762916565,
      0.008408159017562866
    ]
  },
  "EnvelopeSealSurface": {
    "node": "Invitation_Envelope",
    "local": [
      -0.013491405429420483,
      -0.13128727388214112,
      0.01446041867790221
    ]
  },
  "CollarOpeningCenter": {
    "node": "Head",
    "local": [
      -0.0033354251301410537,
      -0.008450729313454027,
      -0.012934685189742482
    ]
  },
  "TorsoCenter": {
    "node": "Spine02",
    "local": [
      0.0,
      -5.767955557622884e-17,
      -1.3877787807814457e-17
    ]
  }
} as const;

const MOTION_SPECS = [
  {
    "name": "Spine01",
    "restQuaternion": [
      2.6292854763544436e-08,
      -5.3399187457345695e-09,
      3.232649915799793e-09,
      0.9999999999999997
    ],
    "localAxes": [
      [
        -6.954547488798536e-09,
        -1.5130589748618713e-07,
        -0.9999999999999886
      ]
    ],
    "minDegrees": [
      -0.14
    ],
    "maxDegrees": [
      0.14
    ]
  },
  {
    "name": "Spine02",
    "restQuaternion": [
      0.006615284269534084,
      0.02325980873454955,
      0.02325978112207207,
      0.9994369424299958
    ],
    "localAxes": [
      [
        0.04618567009720852,
        -0.014305305895246425,
        -0.9988304371117828
      ],
      [
        0.9978359296469775,
        -0.0461855952322712,
        0.04680115702194658
      ]
    ],
    "minDegrees": [
      -0.36,
      -0.14
    ],
    "maxDegrees": [
      0.36,
      0.14
    ]
  },
  {
    "name": "R_Upperarm",
    "restQuaternion": [
      0.3536884871796178,
      -0.2842526901010917,
      0.3806389872386115,
      0.8057411641469302
    ],
    "localAxes": [
      [
        0.7654401431075968,
        0.39176349036013586,
        0.5105122475908545
      ],
      [
        -0.3917637652765694,
        -0.34567345787640413,
        0.8526611359362489
      ]
    ],
    "minDegrees": [
      -0.7419430523696459,
      -0.3473479226807537
    ],
    "maxDegrees": [
      0.741943052369646,
      0.15263875152642847
    ]
  },
  {
    "name": "R_Forearm",
    "restQuaternion": [
      0.31540717118024547,
      0.5030608275644878,
      -0.24112847276702917,
      0.7676621520950789
    ],
    "localAxes": [
      [
        0.9973847748270269,
        0.0002943371489202781,
        -0.07227395318427145
      ]
    ],
    "minDegrees": [
      -0.5800272558004281
    ],
    "maxDegrees": [
      1.319922106186864
    ]
  },
  {
    "name": "R_Hand",
    "restQuaternion": [
      -0.11339877110021966,
      -0.13845168378708467,
      -0.027625583858847672,
      0.983467679736319
    ],
    "localAxes": [
      [
        -0.12171478866461492,
        0.8020763338693802,
        0.5846871512757771
      ]
    ],
    "minDegrees": [
      -0.3
    ],
    "maxDegrees": [
      0.3
    ]
  },
  {
    "name": "L_Upperarm",
    "restQuaternion": [
      -0.4991401274264246,
      0.1641688277988646,
      -0.12209982741534739,
      0.8420209981449523
    ],
    "localAxes": [
      [
        0.978562179976176,
        -0.1608452213849659,
        -0.12862688163014846
      ]
    ],
    "minDegrees": [
      -0.7822912538301563
    ],
    "maxDegrees": [
      0.21764878043512098
    ]
  },
  {
    "name": "L_Forearm",
    "restQuaternion": [
      0.06988900877137341,
      0.12378713304576222,
      -0.16644111641152903,
      0.9757508016460706
    ],
    "localAxes": [
      [
        0.49865960118233443,
        -0.0006387255384376138,
        -0.8667976662280319
      ]
    ],
    "minDegrees": [
      -0.17411902434809678
    ],
    "maxDegrees": [
      0.625833003064125
    ]
  },
  {
    "name": "EnvelopeSuspension",
    "restQuaternion": [
      0.08847878023584449,
      0.447021173782729,
      0.8373830216431861,
      -0.30188284267512755
    ],
    "localAxes": [
      [
        0.0,
        0.0,
        1.0
      ],
      [
        1.0,
        0.0,
        0.0
      ],
      [
        0.0,
        1.0,
        0.0
      ]
    ],
    "minDegrees": [
      -4.862870917530552,
      -0.7,
      -0.6
    ],
    "maxDegrees": [
      2.1369425213699986,
      0.7,
      0.6
    ]
  }
] as const;

export type UnwrittenAnchorName = keyof typeof UNWRITTEN_ANCHOR_BINDINGS;
/** Direct skeletal performance: a five-second breath and a slower offering-arm cycle. */
export const UNWRITTEN_MOTION = {cycleSeconds:10,arrivalBlendSeconds:1.2} as const;
export type UnwrittenRigDriver = {
  readonly valid: true;
  /** Numeric hand/letter arguments are intensity controls, not output vectors. */
  update(time: number, focus: number, strength: number, hand?: number, letter?: number): void;
  getAnchorWorld(name: UnwrittenAnchorName, out: Vector3): Vector3;
  reset(): void;
};

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const bounded = (x: number) => Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;

/** Rest data is baked in the verified asset; no pose is inferred from its bounds. */
export function createUnwrittenRigDriver(root: Object3D): UnwrittenRigDriver {
  const body = root.getObjectByName('Body');
  if (!body || !('isSkinnedMesh' in body) || body.isSkinnedMesh !== true) {
    throw new Error('The Unwritten requires the repaired skinned model.');
  }
  const tracks = MOTION_SPECS.map(spec => {
    const node = root.getObjectByName(spec.name);
    if (!node) throw new Error(`Missing repaired rig node: ${spec.name}`);
    return {
      node,
      rest: new Quaternion(...spec.restQuaternion),
      axes: spec.localAxes.map(axis => new Vector3(...axis).normalize()),
      min: spec.minDegrees,
      max: spec.maxDegrees,
      angles: new Float64Array(spec.localAxes.length),
    };
  });
  const anchorNames = Object.keys(UNWRITTEN_ANCHOR_BINDINGS) as UnwrittenAnchorName[];
  const anchors = {} as Record<UnwrittenAnchorName, {node: Object3D; local: Vector3}>;
  for (const name of anchorNames) {
    const binding = UNWRITTEN_ANCHOR_BINDINGS[name];
    const node = root.getObjectByName(binding.node);
    if (!node) throw new Error(`Missing repaired anchor node: ${binding.node}`);
    anchors[name] = {node, local: new Vector3(...binding.local)};
  }
  const turn = new Quaternion();
  const reset = () => {
    for (const track of tracks) track.node.quaternion.copy(track.rest);
    root.updateWorldMatrix(true, true);
  };
  reset();

  const update: UnwrittenRigDriver['update'] = (time, focus, strength, hand = 1, letter = 1) => {
    const duration=UNWRITTEN_MOTION.cycleSeconds;
    const t = Number.isFinite(time) ? ((time % duration) + duration) % duration : 0;
    const phase = t * TAU / duration;
    const attention = bounded(focus);
    const idle = 1 - attention;
    const amount = bounded(strength);
    const handAmount = bounded(hand);
    const letterAmount = bounded(letter);
    const sin1 = Math.sin(phase);
    const sin2 = Math.sin(phase * 2);
    // Preserve the verified upper-body angle bounds; change timing without stretching the coat.
    tracks[0].angles[0] = .14 * sin2;
    tracks[1].angles[0] = .36 * sin2;
    tracks[1].angles[1] = .14 * sin1;
    tracks[2].angles[0] = (.65 * sin1 + .2 * sin2) * idle + .60 * attention;
    tracks[2].angles[1] = .25 * (Math.sin(phase + .4) - Math.sin(.4)) * idle;
    tracks[3].angles[0] = .95 * (Math.sin(phase - .4) - Math.sin(-.4)) * idle + .65 * attention;
    tracks[4].angles[0] = .30 * sin2 * idle + .15 * attention;
    tracks[5].angles[0] = .50 * (Math.sin(phase + .6) - Math.sin(.6));
    tracks[6].angles[0] = .40 * (Math.sin(phase - .6) - Math.sin(-.6));
    tracks[7].angles[0] = 3.5 * (Math.sin(phase * 2 + .4) - Math.sin(.4));
    // The native letter swings at its actual pinch pivot, with a quieter secondary roll.
    tracks[7].angles[1] = .55 * sin2;
    tracks[7].angles[2] = .6 * Math.sin(phase-.25)*Math.sin(phase);

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const part = i >= 2 && i <= 4 ? handAmount : i === 7 ? letterAmount : 1;
      track.node.quaternion.copy(track.rest);
      for (let j = 0; j < track.axes.length; j++) {
        const degrees = Math.min(track.max[j], Math.max(track.min[j], track.angles[j]));
        turn.setFromAxisAngle(track.axes[j], degrees * DEG * amount * part);
        track.node.quaternion.multiply(turn);
      }
    }
    // This updates real bones and their attached letter before sampling world anchors.
    root.updateWorldMatrix(true, true);
  };
  return {
    valid: true,
    update,
    reset,
    getAnchorWorld(name, out) {
      const binding = anchors[name];
      return out.copy(binding.local).applyMatrix4(binding.node.matrixWorld);
    },
  };
}
