Add-Type -AssemblyName System.Drawing
$out=Join-Path $PSScriptRoot '../docs/xuan-layer-preview'
New-Item -ItemType Directory -Force $out | Out-Null
$sets=@(
 @{file='一';name='te';title='特悬：5 层方案';boxes=@(@(95,88,320,218),@(140,211,95,139),@(196,191,79,155),@(249,217,68,127),@(296,187,61,140));labels=@('R1 钟架','D1 左一舞人','D2 左二舞人','D3 右二舞人','D4 右一舞人')},
 @{file='两';name='pan';title='判悬：4 层方案（按实际两座钟架）';boxes=@(@(66,38,218,223),@(375,46,272,203),@(148,137,186,141),@(334,124,272,151));labels=@('R1 左钟架','R2 右钟架','D1 左舞人组','D2 右舞人组')},
 @{file='三';name='xuan';title='轩悬：5 层方案（按实际三座钟架）';boxes=@(@(43,47,176,183),@(270,55,193,107),@(519,46,177,186),@(106,117,248,147),@(354,114,264,150));labels=@('R1 左钟架','R2 后中钟架','R3 右钟架','D1 左舞人组','D2 右舞人组')},
 @{file='四';name='gong';title='宫悬：6 层建议（舞人分左右两组，待确认）';boxes=@(@(73,49,171,174),@(290,58,192,94),@(535,48,168,131),@(400,155,324,189),@(99,137,184,151),@(283,131,320,159));labels=@('R1 后左钟架','R2 后中钟架','R3 后右钟架','R4 前右钟架','D1 左舞人组','D2 中右舞人组')}
)
$colors=@('#55C8FF','#BD94FF','#68D9B0','#FF8C6B','#FFE076','#EF8CDA')
$font=[Drawing.Font]::new('Microsoft YaHei',14)
$small=[Drawing.Font]::new('Microsoft YaHei',10)
foreach($set in $sets){
 $src=[Drawing.Bitmap]::new("D:/Personal/Desktop/网站页面$($set.file)图红色框动态展示动画.png")
 $bmp=[Drawing.Bitmap]::new(1200,730);$g=[Drawing.Graphics]::FromImage($bmp);$g.Clear([Drawing.ColorTranslator]::FromHtml('#14232B'));$g.SmoothingMode='AntiAlias'
 $g.DrawString($set.title,$font,[Drawing.Brushes]::White,25,15)
 $g.DrawString("原图 $($src.Width) × $($src.Height) px；框线表示候选范围，不是最终裁切线 / 蒙版",$small,[Drawing.Brushes]::LightGray,25,50)
 $scale=[Math]::Min(820.0/$src.Width,490.0/$src.Height);$ox=25;$oy=90
 $g.DrawImage($src,[single]$ox,[single]$oy,[single]($src.Width*$scale),[single]($src.Height*$scale))
 for($i=0;$i -lt $set.boxes.Count;$i++){
  $b=$set.boxes[$i];$color=[Drawing.ColorTranslator]::FromHtml($colors[$i]);$pen=[Drawing.Pen]::new($color,2);$pen.DashStyle='Dash'
  $x=$ox+$b[0]*$scale;$y=$oy+$b[1]*$scale;$w=$b[2]*$scale;$h=$b[3]*$scale
  $g.DrawRectangle($pen,[single]$x,[single]$y,[single]$w,[single]$h)
  $brush=[Drawing.SolidBrush]::new($color);$id=$set.labels[$i].Split(' ')[0]
  $g.FillRectangle([Drawing.Brushes]::Black,[single]$x,[single]$y,34,23);$g.DrawString($id,$small,$brush,[single]$x,[single]$y)
  $g.DrawString($set.labels[$i],$font,$brush,870,(100+$i*68))
  $g.DrawString("x=$($b[0]), y=$($b[1])`nw=$($b[2]), h=$($b[3])",$small,[Drawing.Brushes]::LightGray,870,(128+$i*68))
  $pen.Dispose();$brush.Dispose()
 }
 $g.DrawString('遮挡核查：彩框交叠处需沿真实轮廓制作蒙版，不可直接矩形切开。',$font,[Drawing.Brushes]::Gold,25,600)
 $g.DrawString('钟架：顶部为摆动轴；舞人：脚底为轴。被遮住的像素不在原 PNG 中，独立晃动可能需要补绘。',$small,[Drawing.Brushes]::LightGray,25,640)
 $g.DrawString('请检查：分组是否合适、人物是否应调整归组、宫悬是否接受两组舞人。此图不代表已完成拆层。',$small,[Drawing.Brushes]::LightGray,25,676)
 $bmp.Save((Join-Path $out "$($set.name)-annotated.png"),[Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$bmp.Dispose();$src.Dispose()
}
$font.Dispose();$small.Dispose()
