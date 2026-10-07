import type { ObjectType } from '../domain/model';
export function ObjectThumbnail({ type }: { type: ObjectType }) {
  const common = { stroke: '#74786c', strokeWidth: 1.05, strokeLinejoin: 'round' as const };
  const shapes: Record<ObjectType, React.ReactNode> = {
    bangchakSign: (
      <>
        <path d="M14 77 78 63l16 7-64 17Z" fill="#c8c9be" />
        <path d="M17 74V49q0-22 23-25v10l42-7q6 0 6 7v31L27 80Z" fill="#efede2" />
        <path d="M27 80V48q0-19 16-20v10l39-9v37Z" fill="#dfdfd2" />
        <path d="M31 49q-1-11 10-13v14q-4 13-10 5Z" fill="#548845" stroke="none" />
        <path
          d="m46 45 31-7m-31 12 30-7m-23 14 23-5m-40 15 39-9"
          stroke="#537844"
          strokeWidth="3"
        />
      </>
    ),
    oilDisplayStand: (
      <>
        <path d="M14 60q0-5 6-6l57-12q9-1 13 7v24L28 88q-14 0-14-8Z" fill="#e9e7dc" />
        <path d="m14 78 14 7 61-15v5L28 91 14 84Z" fill="#c6c9bf" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(${24 + i * 13} ${49 - i * 2.7})`}>
            <ellipse rx="6" ry="3" fill="#acb7ad" />
            <path d="M-4 0v-18h8V0Z" fill={i === 2 || i === 4 ? '#c0d0b2' : '#495646'} />
            <ellipse cy="-18" rx="5" ry="2" fill="#c9d1c5" />
            <path d="m-3 13 6-1" stroke="#67805a" strokeWidth="2" />
          </g>
        ))}
      </>
    ),
    rollupBanner: (
      <>
        <path d="M40 84v8m27-14v9" stroke="#8d998e" strokeWidth="3" />
        <path d="m29 85 44-10 7 4-44 11Z" fill="#abb3a8" />
        <path d="m33 22 38-9v63l-38 9Z" fill="#e5e6d7" />
        <path d="m33 66 38-9v19l-38 9Z" fill="#607961" />
        <path d="m32 21 40-9M40 34l22-5m-22 11 17-4" stroke="#83947c" strokeWidth="2" />
        <path d="M43 64V52q8-17 17-4v12" stroke="#a6b498" fill="none" />
      </>
    ),
    backdrop: (
      <>
        <path d="M23 25 76 15v52L23 80Z" fill="#bfc8b4" />
        <path d="m76 15 5 3v51l-5-2ZM23 80l53-13 5 2-52 14Z" fill="#969f8e" />
        <path d="m30 51 37-8M30 58l25-5" stroke="#ebede6" strokeWidth="3" />
      </>
    ),
    wall: (
      <>
        <path d="m21 28 54-14 7 5-54 14Z" fill="#eeebe3" />
        <path d="m21 28 7 5v49l-7-5Z" fill="#b6b7aa" />
        <path d="m28 33 54-14v50L28 82Z" fill="#d9dacd" />
      </>
    ),
    counter: (
      <>
        <path d="m20 44 46-11 26 14-46 12Z" fill="#f3eee3" />
        <path d="m20 44 26 15v25L20 69Z" fill="#c8c1b1" />
        <path d="m46 59 46-12v25L46 84Z" fill="#e2dccc" />
        <path d="m50 63 37-10v16L50 80Z" fill="#e5dfd1" stroke="#c4c0b3" />
        <path d="m25 69 22 12 41-10v4L47 87 25 74Z" fill="#858b7b" />
        <path d="m59 66 18-5" stroke="#8a907c" />
      </>
    ),
    table: (
      <>
        <ellipse cx="52" cy="39" rx="32" ry="14" fill="#a79071" />
        <ellipse cx="52" cy="36" rx="32" ry="14" fill="#cfb798" />
        <path d="M34 32q18 6 34-1M30 37q20 7 41-1" stroke="#b79e7d" opacity=".35" fill="none" />
        <path d="M49 50v26l-12 7m18-33v26l12 7" fill="none" stroke="#60675c" strokeWidth="3" />
        <ellipse cx="52" cy="81" rx="17" ry="5" fill="#8a9182" />
        <path d="M52 50v30" stroke="#60675c" strokeWidth="4" />
      </>
    ),
    chair: (
      <>
        <path d="M34 46 37 23q1-6 7-4l23 6q4 1 3 6l-3 19q-1 5-6 4Z" fill="#babda9" />
        <path
          d="M30 49 63 46q4 0 6 3l11 11q3 4-2 5l-33 5q-4 1-7-2L28 55q-3-4 2-6Z"
          fill="#c6c8b8"
        />
        <path d="m30 53-2 27m15-12v22m34-27 2 20M67 50l3 26" stroke="#666e60" strokeWidth="3" />
      </>
    ),
    stool: (
      <>
        <ellipse cx="52" cy="84" rx="20" ry="6" fill="#697360" />
        <path d="M52 35v48" stroke="#697360" strokeWidth="4" />
        <ellipse cx="52" cy="62" rx="16" ry="6" fill="none" stroke="#697360" strokeWidth="2" />
        <ellipse cx="52" cy="33" rx="23" ry="10" fill="#aa9476" />
        <ellipse cx="52" cy="30" rx="23" ry="10" fill="#cbb494" />
      </>
    ),
    tv: (
      <>
        <path d="m19 30 60-13 6 4-60 14Z" fill="#686e64" />
        <path d="m25 35 60-14v39L25 75Z" fill="#3d4840" />
        <path d="m30 39 50-12v29L30 69Z" fill="#697d71" />
        <path d="m37 59 14-12 19 2" fill="none" stroke="#b5c5b3" strokeWidth="2" />
      </>
    ),
    banner: (
      <>
        <path d="m33 21 37-8v65l-37 9Z" fill="#bec7b1" />
        <path d="m30 84 43-10 8 5-43 11Z" fill="#a1a596" />
        <path d="m40 38 23-5m-23 9 17-4" stroke="#f2f1e9" strokeWidth="3" />
      </>
    ),
    stand: (
      <>
        <path d="m35 30 25-7 20 12-25 7Z" fill="#eee9dd" />
        <path d="m35 30 20 12v43L35 72Z" fill="#c3c2b4" />
        <path d="m55 42 25-7v43l-25 7Z" fill="#dedccd" />
        <path d="m33 29 27-8 23 13-28 9Z" fill="#eeeadd" />
        <path d="m37 72 18 12 23-7v5l-23 7-18-11Z" fill="#929889" />
      </>
    ),
    shelf: (
      <>
        <path d="m25 22 43-10 10 6-43 10Zm0 0v60l10 7V28m33-16v60l10 7V18" fill="#b8a080" />
        {[36, 53, 70, 85].map((y) => (
          <path key={y} d={`m35 ${y} 43-10-10-7-43 10Z`} fill="#d0b797" />
        ))}
      </>
    ),
    plant: (
      <>
        <path d="m34 64 5 24q14 8 27-2l6-22" fill="#d4cebd" />
        <ellipse cx="53" cy="64" rx="19" ry="7" fill="#c1b9a6" />
        <path d="M53 69V24" stroke="#88916e" strokeWidth="3" />
        {[
          [39, 37, -40],
          [66, 28, 35],
          [40, 54, -50],
          [67, 47, 40],
          [53, 20, 0],
        ].map(([x, y, a]) => (
          <ellipse
            key={y}
            cx={x}
            cy={y}
            rx="9"
            ry="17"
            transform={`rotate(${a} ${x} ${y})`}
            fill={y % 2 ? '#849775' : '#a0af8f'}
            stroke="none"
          />
        ))}
      </>
    ),
    light: (
      <>
        <ellipse cx="52" cy="84" rx="18" ry="5" fill="#798171" />
        <path d="M52 37v47" stroke="#5d6758" strokeWidth="3" />
        <path d="m39 14-13 25q27 15 53 0L66 14Z" fill="#e7dfc9" />
        <ellipse cx="52" cy="14" rx="14" ry="5" fill="#d0c7ad" />
      </>
    ),
    sign: (
      <>
        <path d="m22 36 55-13 5 3v35L27 74l-5-3Z" fill="#d9d8c6" />
        <path d="m32 49 39-9m-39 16 24-6" stroke="#79836b" strokeWidth="3" />
      </>
    ),
    human: (
      <>
        <circle cx="53" cy="20" r="8" fill="#a3aa9a" />
        <path
          d="M53 35v27m-11-26-7 24m29-24 7 24M48 59l-3 28m13-28 3 28"
          stroke="#a3aa9a"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </>
    ),
    box: (
      <>
        <path d="m25 40 30-11 26 16-30 11Z" fill="#dedbcc" />
        <path d="m25 40 26 16v29L25 68Z" fill="#b8b9a9" />
        <path d="m51 56 30-11v29L51 85Z" fill="#d0d0bd" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 104 100" aria-hidden="true">
      <ellipse cx="53" cy="86" rx="27" ry="5" fill="#626b4f" opacity=".065" />
      <g {...common}>{shapes[type]}</g>
    </svg>
  );
}
