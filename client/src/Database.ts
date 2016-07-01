
class Base {

    public name: string = '';

}

export class Database extends Base {

    public tables: Table[] = [];

}

export class Table extends Base {

    public columns: Column[] = [];

}

export class Column extends Base {



}