

// // Now you can use the d3-shape and mathjs libraries in your logistic fit code
// export function logisticFit(points: { x: number, y: number }[]): number {
//   const x = points.map(p => p.x);
//   const y = points.map(p => p.y);

//   const result = math.LSQFit(x, y, (x: number, p: number[]) => 1 / (1 + Math.exp(-(p[0] + p[1] * x))), [0, 0.001]);

//   const [a, b] = result.parameterValues;
//   const xValue = Math.log((0.5 - 1) / (0.5)) / -b;

//   return xValue;
// }

export function testLogisticFit() {
    // const points: {x: number, y: number}[] = [
    //     { x: 1500, y: 0 },
    //     { x: 1600, y: 0 },
    //     { x: 1700, y: 1 },
    //     { x: 1800, y: 0 },
    //     { x: 1900, y: 1 },
    //     { x: 2100, y: 1 },
    //     { x: 2700, y: 1 },
    //   ]

    //     console.log(logisticFit(points));
    
}