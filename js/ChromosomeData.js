/**
 * NOTE THAT "CENTROMERE" HERE ACTUALLY REFERS TO THE CENTROMERE AND THE 
 * PERICENTROMERE.  Basically it's all the unmappable positions contiguous 
 * with the centromere.  For some short chromosomes, such as chr 13, the 
 * entire short arm is unmappable and is thus included in the "centromere". 
 */

var CDATA = CDATA || {};

function ChromosomeData(centromereStart, centromereEnd, chromosomeEnd){
    this.chromosomeStart = 0;
    this.centromereStart = centromereStart;
    this.centromereEnd = centromereEnd;
    this.chromosomeEnd = chromosomeEnd;
}

CDATA.chr1 = new ChromosomeData(121500000, 142600000, 249250621);

CDATA.chr2 = new ChromosomeData(90498822, 95321621, 243199373);

CDATA.chr3 = new ChromosomeData(90548159, 93495226, 198022430);

CDATA.chr4 = new ChromosomeData(49677386, 52618941, 191154276);

CDATA.chr5 = new ChromosomeData(46415518, 49429326, 180915260);

CDATA.chr6 = new ChromosomeData(58800906, 61863103, 171115067);

CDATA.chr7 = new ChromosomeData(57912375, 61504652, 159138663);

CDATA.chr8 = new ChromosomeData(43865326, 46827649, 146364022);

CDATA.chr9 = new ChromosomeData(47230129, 65464699, 141213431);

CDATA.chr10 = new ChromosomeData(39197039, 42220905, 135534747);

CDATA.chr11 = new ChromosomeData(51621618, 54697528, 135006516);

CDATA.chr12 = new ChromosomeData(34874580, 37846199, 133851895);

CDATA.chr13 = new ChromosomeData(1, 19027509, 115169878);

CDATA.chr14 = new ChromosomeData(1, 19095775, 107349540);

CDATA.chr15 = new ChromosomeData(1, 19956528, 102531392);

CDATA.chr16 = new ChromosomeData(35352072, 46308899, 90354753);

CDATA.chr17 = new ChromosomeData(22273274, 25256685, 81195210);

CDATA.chr18 = new ChromosomeData(15395378, 18500244, 78077248);

CDATA.chr19 = new ChromosomeData(24611373, 27718549, 59128983);

CDATA.chr20 = new ChromosomeData(26325903, 29414525, 63025520);

CDATA.chr21 = new ChromosomeData(1, 14335513, 48129895);

CDATA.chr22 = new ChromosomeData(1, 16058460, 51304566);

CDATA.chrX = new ChromosomeData(58564294, 61683230, 155270560);

CDATA.chrY = new ChromosomeData(11600000, 13400000, 59373566);

CDATA.chrTEST = new ChromosomeData(9000, 12000, 19900);