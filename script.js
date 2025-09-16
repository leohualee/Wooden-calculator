// 木材規格數據
let woodSpecs = [
    {width: 30, length: 300, thickness: 10, count: 1}
];
let currentWoodIndex = 0;

// 自動計算功能
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', calculate);
});

document.querySelectorAll('input[name="method"]').forEach(radio => {
    radio.addEventListener('change', calculate);
});

// 調整數值功能
function adjustValue(inputId, change) {
    const input = document.getElementById(inputId);
    const currentValue = parseFloat(input.value) || 0;
    const newValue = Math.max(currentValue + change, parseFloat(input.min) || 0);
    input.value = newValue;
    calculate();
}

// 木材管理功能
function addWoodSpec() {
    const width = parseFloat(document.getElementById('woodWidth').value) || 30;
    const length = parseFloat(document.getElementById('woodLength').value) || 300;
    const thickness = parseFloat(document.getElementById('woodThickness').value) || 10;
    const count = parseFloat(document.getElementById('woodCount').value) || 1;
    
    woodSpecs.push({width, length, thickness, count});
    updateWoodCards();
    currentWoodIndex = woodSpecs.length - 1;
    selectWood(currentWoodIndex);
    calculate();
}

function updateWoodSpec() {
    const width = parseFloat(document.getElementById('woodWidth').value) || 30;
    const length = parseFloat(document.getElementById('woodLength').value) || 300;
    const thickness = parseFloat(document.getElementById('woodThickness').value) || 10;
    const count = parseFloat(document.getElementById('woodCount').value) || 1;
    
    woodSpecs[currentWoodIndex] = {width, length, thickness, count};
    updateWoodCards();
    calculate();
}

function deleteWoodSpec() {
    if (woodSpecs.length > 1) {
        woodSpecs.splice(currentWoodIndex, 1);
        currentWoodIndex = Math.min(currentWoodIndex, woodSpecs.length - 1);
        updateWoodCards();
        selectWood(currentWoodIndex);
        calculate();
    }
}

function selectWood(index) {
    currentWoodIndex = index;
    const spec = woodSpecs[currentWoodIndex];
    document.getElementById('woodWidth').value = spec.width;
    document.getElementById('woodLength').value = spec.length;
    document.getElementById('woodThickness').value = spec.thickness;
    document.getElementById('woodCount').value = spec.count;
    updateWoodCards(); // 更新選中狀態
    calculate();
}

function updateWoodCards() {
    const container = document.getElementById('woodCards');
    container.innerHTML = '';
    
    woodSpecs.forEach((spec, index) => {
        const card = document.createElement('div');
        card.className = `p-2 border rounded-lg cursor-pointer transition-colors ${
            index === currentWoodIndex 
                ? 'border-amber-500 bg-amber-50' 
                : 'border-gray-200 hover:border-gray-300'
        }`;
        card.onclick = () => selectWood(index);
        
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="text-sm font-medium">
                    ${spec.width} × ${spec.length} × ${spec.thickness} mm (${spec.count}隻)
                </div>
                <div class="text-xs text-gray-500">
                    ${index === currentWoodIndex ? '✓ 已選' : ''}
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// 獲取選中的切割方式
function getSelectedMethod() {
    const radios = document.querySelectorAll('input[name="method"]');
    for (let radio of radios) {
        if (radio.checked) {
            return parseInt(radio.value);
        }
    }
    return 1;
}

// 動態生成切割示意圖
function generateCuttingVisualization(requiredPieces, sawKerf, woodSpecs) {
    let piecesToCut = [...requiredPieces];
    let svgContent = '';
    const woodVisualWidth = 600;
    const drawingPadding = 20;

    let woodSupply = [];
    woodSpecs.forEach(spec => {
        for (let i = 0; i < spec.count; i++) {
            woodSupply.push(spec.length);
        }
    });
    
    if (woodSupply.length === 0 || piecesToCut.length === 0) {
        return `<div class="text-center text-gray-500 py-8"><p>無須切割</p></div>`;
    }
    
    piecesToCut.sort((a, b) => b - a);

    let woodIndex = 0;
    const colors = ['#D2691E', '#CD853F', '#DEB887', '#F4A460'];

    while (piecesToCut.length > 0 && woodIndex < woodSupply.length) {
        let currentWoodLength = woodSupply[woodIndex];
        let remainingWood = currentWoodLength;
        let cutsOnThisPiece = [];
        
        let singleWoodSvgContent = '';
        
        // 嘗試將所需木塊放入當前木料
        while (piecesToCut.length > 0) {
            let nextPiece = piecesToCut[0];
            let requiredSpace = nextPiece + (cutsOnThisPiece.length > 0 ? sawKerf : 0);
            
            if (remainingWood >= requiredSpace) {
                cutsOnThisPiece.push(nextPiece);
                remainingWood -= requiredSpace;
                piecesToCut.shift();
            } else {
                break;
            }
        }

        const scale = (woodVisualWidth - 2 * drawingPadding) / currentWoodLength;
        let currentX = drawingPadding;

        // 繪製木料基底
        singleWoodSvgContent += `<rect x="${drawingPadding}" y="50" width="${(currentWoodLength) * scale}" height="50" fill="#f5e6d3" rx="5"/>`;
        singleWoodSvgContent += `<text x="${drawingPadding + (currentWoodLength * scale) / 2}" y="20" text-anchor="middle" class="text-sm font-semibold">木料 ${woodIndex + 1} (${currentWoodLength}mm)</text>`;

        // 繪製切割段
        cutsOnThisPiece.forEach((piece, index) => {
            if (index > 0) {
                let kerfVisualWidth = sawKerf * scale;
                let lineX = currentX + kerfVisualWidth / 2;
                singleWoodSvgContent += `<line x1="${lineX}" y1="50" x2="${lineX}" y2="100" stroke="red" stroke-width="2" stroke-dasharray="4, 4"/>`;
                singleWoodSvgContent += `<text x="${lineX}" y="40" text-anchor="middle" class="text-xs text-red-600">${sawKerf.toFixed(1)}mm</text>`;
                currentX += kerfVisualWidth;
            }
            
            let pieceVisualWidth = piece * scale;
            singleWoodSvgContent += `<rect x="${currentX}" y="50" width="${pieceVisualWidth}" height="50" fill="${colors[index % colors.length]}" stroke="#8B4513" stroke-width="2"/>`;
            singleWoodSvgContent += `<text x="${currentX + pieceVisualWidth / 2}" y="125" text-anchor="middle" class="text-xs">${piece.toFixed(1)}mm</text>`;
            currentX += pieceVisualWidth;
        });

        // 繪製剩餘木料
        if (remainingWood > 0) {
            if (cutsOnThisPiece.length > 0) {
                let kerfVisualWidth = sawKerf * scale;
                let lineX = currentX + kerfVisualWidth / 2;
                singleWoodSvgContent += `<line x1="${lineX}" y1="50" x2="${lineX}" y2="100" stroke="red" stroke-width="2" stroke-dasharray="4, 4"/>`;
                singleWoodSvgContent += `<text x="${lineX}" y="40" text-anchor="middle" class="text-xs text-red-600">${sawKerf.toFixed(1)}mm</text>`;
                currentX += kerfVisualWidth;
            }
            
            let remainingVisualWidth = remainingWood * scale;
            singleWoodSvgContent += `<rect x="${currentX}" y="50" width="${remainingVisualWidth}" height="50" fill="#eee" stroke="#8B4513" stroke-width="2"/>`;
            singleWoodSvgContent += `<text x="${currentX + remainingVisualWidth / 2}" y="125" text-anchor="middle" class="text-xs"></text>`;
        }
        
        svgContent += `<svg viewBox="0 0 ${woodVisualWidth} 200" class="w-full h-auto border rounded bg-white overflow-hidden my-4">${singleWoodSvgContent}</svg>`;
        
        woodIndex++;
    }

    return svgContent;
}


// 生成切割詳細尺寸
function generateCuttingDetails(method, data) {
    const {boxLength, boxWidth, woodThickness, requiredPieces, isSquare} = data;
    
    let detailsHTML = '';
    
    if (method === 1) {
        // 方式一：環形黏接
        const sidePieceLength = (boxLength - woodThickness * 2);
        const endPieceLength = (boxWidth - woodThickness * 2);
        
        let sideLabel;
        if (isSquare) {
            sideLabel = `邊長長度：${sidePieceLength.toFixed(1)} mm × 4段`;
        } else {
            sideLabel = `長邊長度：${sidePieceLength.toFixed(1)} mm × 2段<br>短邊長度：${endPieceLength.toFixed(1)} mm × 2段`;
        }
        
        detailsHTML = `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-blue-800 mb-4">🔧 方式一：環形黏接 - 切割尺寸</h3>
                
                <div class="mb-6">
                    ${generateCuttingVisualization(requiredPieces, data.sawKerf, woodSpecs)}
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="space-y-2">
                        <h4 class="font-medium text-gray-800">側板切割：</h4>
                        <div class="space-y-1">
                            <div>• ${sideLabel}</div>
                            <div>• 切割次數：4 次</div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-medium text-gray-800">底板切割：</h4>
                        <div class="space-y-1">
                            <div>• 底板尺寸：${(boxLength - 2 * woodThickness).toFixed(1)} × ${(boxWidth - 2 * woodThickness).toFixed(1)} mm</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (method === 2) {
        // 方式二：對稱黏接
        const longPiece = boxLength;
        const shortPiece = boxWidth - 2 * woodThickness;
        
        detailsHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-green-800 mb-4">🔧 方式二：對稱黏接 - 切割尺寸</h3>
                
                <div class="mb-6">
                    ${generateCuttingVisualization(requiredPieces, data.sawKerf, woodSpecs)}
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="space-y-2">
                        <h4 class="font-medium text-gray-800">側板切割：</h4>
                        <div class="space-y-1">
                            <div>• 長邊：${longPiece.toFixed(1)} mm × 2段</div>
                            <div>• 短邊：${shortPiece.toFixed(1)} mm × 2段</div>
                            <div>• 切割次數：4 次</div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-medium text-gray-800">底板切割：</h4>
                        <div class="space-y-1">
                            <div>• 底板尺寸：${(boxLength - 2 * woodThickness).toFixed(1)} × ${(boxWidth - 2 * woodThickness).toFixed(1)} mm</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    document.getElementById('cuttingDetails').innerHTML = detailsHTML;
}

// 主計算函數
function calculate() {
    try {
        const boxLength = parseFloat(document.getElementById('boxLength').value) || 0;
        const boxWidth = parseFloat(document.getElementById('boxWidth').value) || 0;
        const boxHeight = parseFloat(document.getElementById('boxHeight').value) || 0;
        const sawKerf = parseFloat(document.getElementById('sawKerf').value) || 0;
        
        const selectedWood = woodSpecs[currentWoodIndex];
        const woodWidth = selectedWood.width;
        const woodThickness = selectedWood.thickness;
        
        const selectedMethod = getSelectedMethod();
        
        let requiredPieces = [];
        
        if (selectedMethod === 1) {
            const sidePieceLength = boxLength - 2 * woodThickness;
            const endPieceLength = boxWidth - 2 * woodThickness;
            requiredPieces.push(sidePieceLength, endPieceLength, sidePieceLength, endPieceLength);
        } else {
            const longPiece = boxLength;
            const shortPiece = boxWidth - 2 * woodThickness;
            requiredPieces.push(longPiece, longPiece, shortPiece, shortPiece);
        }

        // 檢查木板寬度是否足夠製作盒子高度
        let resultsHTML = '';
        if (boxHeight > woodWidth) {
            resultsHTML = `
                <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p class="font-bold">⚠️ 材料寬度不足！</p>
                    <p class="text-sm">您選擇的木材寬度為 <span class="font-medium">${woodWidth} mm</span>，不足以製作高度為 <span class="font-medium">${boxHeight} mm</span> 的盒子。請更換木材規格或調整盒子高度。</p>
                </div>
            `;
            document.getElementById('results').innerHTML = resultsHTML;
            document.getElementById('cuttingDetails').innerHTML = '';
            return;
        }

        // 模擬切割過程以計算總所需長度
        let piecesToCut = [...requiredPieces].sort((a, b) => b - a);
        let woodSupply = [];
        woodSpecs.forEach(spec => {
            for (let i = 0; i < spec.count; i++) {
                woodSupply.push(spec.length);
            }
        });
        
        let totalUsedBoards = 0;
        let totalCuts = 0;
        let totalPiecesLength = 0;
        
        while (piecesToCut.length > 0 && totalUsedBoards < woodSupply.length) {
            let currentWoodLength = woodSupply[totalUsedBoards];
            let remainingWood = currentWoodLength;
            let cutsOnThisPiece = 0;
            
            let i = 0;
            while (i < piecesToCut.length) {
                let nextPiece = piecesToCut[i];
                let requiredSpace = nextPiece + (cutsOnThisPiece > 0 ? sawKerf : 0);
                
                if (remainingWood >= requiredSpace) {
                    cutsOnThisPiece++;
                    remainingWood -= requiredSpace;
                    totalPiecesLength += nextPiece;
                    piecesToCut.splice(i, 1);
                } else {
                    i++;
                }
            }
            
            if (cutsOnThisPiece > 0) {
                totalCuts += (cutsOnThisPiece - 1);
                totalUsedBoards++;
            }
        }

        // 檢查是否所有零件都可被切割
        if (piecesToCut.length > 0) {
            resultsHTML = `
                <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <p class="font-bold">⚠️ 材料長度不足！</p>
                    <p class="text-sm">您選擇的木材總長度不足以製作此盒子。請增加木材數量或使用更長的木材。</p>
                </div>
            `;
            document.getElementById('results').innerHTML = resultsHTML;
            document.getElementById('cuttingDetails').innerHTML = '';
            return;
        }
        
        // 總長度計算
        const totalUsedLength = totalPiecesLength + sawKerf * totalCuts;
        const isSquare = (boxLength === boxWidth);
        
        // 顯示結果
        if (selectedMethod === 1) {
            const sidePieceLength = boxLength - 2 * woodThickness;
            const endPieceLength = boxWidth - 2 * woodThickness;
            
            let sideLabel = isSquare ? `邊長長度：` : `長邊長度：`;
            
            resultsHTML = `
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm">總所需長度：</span>
                        <span class="text-lg font-bold text-amber-600">${totalUsedLength.toFixed(1)} mm</span>
                    </div>
                    <hr>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">切割段數：</span>
                        <span class="text-lg font-bold text-gray-800">4 段</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">${sideLabel}</span>
                        <span class="text-lg font-bold text-gray-800">${sidePieceLength.toFixed(1)} mm</span>
                    </div>
                    ${isSquare ? '' : `
                        <div class="flex justify-between items-center">
                            <span class="text-sm">短邊長度：</span>
                            <span class="text-lg font-bold text-gray-800">${endPieceLength.toFixed(1)} mm</span>
                        </div>
                    `}
                </div>
            `;
        } else if (selectedMethod === 2) {
            const longPiece = boxLength;
            const shortPiece = boxWidth - 2 * woodThickness;
            
            resultsHTML = `
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm">總所需長度：</span>
                        <span class="text-lg font-bold text-amber-600">${totalUsedLength.toFixed(1)} mm</span>
                    </div>
                    <hr>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">切割段數：</span>
                        <span class="text-lg font-bold text-gray-800">4 段</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">長邊長度：</span>
                        <span class="text-lg font-bold text-gray-800">${longPiece.toFixed(1)} mm <span class="text-xs text-gray-500">× 2段</span></span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">短邊長度：</span>
                        <span class="text-lg font-bold text-gray-800">${shortPiece.toFixed(1)} mm <span class="text-xs text-gray-500">× 2段</span></span>
                    </div>
                </div>
            `;
        }
        
        document.getElementById('results').innerHTML = resultsHTML;
        
        // 呼叫詳細顯示和視覺化函數
        const data = { boxLength, boxWidth, woodThickness, sawKerf, requiredPieces, isSquare };
        generateCuttingDetails(selectedMethod, data);

    } catch (e) {
        console.error('An error occurred during calculation:', e);
        document.getElementById('results').innerHTML = `
            <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p class="font-bold">程式發生錯誤！</p>
                <p class="text-sm">錯誤訊息：${e.message}</p>
            </div>
        `;
        document.getElementById('cuttingDetails').innerHTML = '';
    }
}

// PDF下載功能
async function downloadPDF() {
    const resultsSection = document.getElementById('results').parentElement;
    const detailsSection = document.getElementById('cuttingDetails').parentElement;

    const sections = [resultsSection, detailsSection];
    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    let yOffset = 10;

    for (const section of sections) {
        const canvas = await html2canvas(section, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; 
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (yOffset + imgHeight > pageHeight) {
            pdf.addPage();
            yOffset = 10;
        }

        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 10;
    }
    
    pdf.save('木盒子切割計算結果.pdf');
}

// 初始化時先執行一次計算
updateWoodCards();
calculate();