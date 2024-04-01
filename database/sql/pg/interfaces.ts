export interface DbTableDecriber{
	tableCatalog:string;
	tableSchema:string;
	tableName:string;
	tableType:string;
	selfReferencingColumnName:string|null;
	referenceGeneration:string|null;
	userDefinedTypeCatalog:string|null;
	userDefinedTypeSchema:string|null;
	userDefinedTypeName:string|null;
	isInsertableInto:'YES'|'NO';
	isTyped:'YES'|'NO';
	commitAction: null;
}

export interface DbColumnDescriber{
	tableCatalog:string;
	tableSchema:string;
	tableName:string;
	columnName:string;
	ordinalPosition:number;
	columnDefault:string;
	isNullable:'YES'|'NO';
	dataType:string;
	characterMaximumLength:number|null;
	characterOctetLength:number|null;
	numericPrecision:number|null;
	numericPrecisionRadix:number|null;
	numericScale:number|null;
	datetimePrecision: null;
	// intervalType: null;
	// intervalPrecision: null;
	characterSetCatalog:string|null;
	characterSetSchema:string|null;
	characterSetName:string|null;
	collationCatalog:string|null;
	collationSchema:string|null;
	collationName:string|null;
	domainCatalog:string|null;
	domainSchema:string|null;
	domainName:string|null;
	udtCatalog:string;
	udtSchema:string;
	udtName:string;
	// scopeCatalog: null;
	// scopeSchema: null;
	// scopeName: null;
	// maximumCardinality: null;
	// dtdIdentifier: '1';
	// isSelfReferencing: 'NO';
	// isIdentity: 'NO';
	// identityGeneration: null;
	// identityStart: null;
	// identityIncrement: null;
	// identityMaximum: null;
	// identityMinimum: null;
	// identityCycle: 'NO';
	// isGenerated: 'NEVER';
	// generationExpression: null;
	// isUpdatable: 'YES'
	isKey:boolean;
}

export interface DbTableKeyDescriber{
    constraintCatalog:string;
	constraintSchema:string;
	constraintName:string;
	tableCatalog:string;
	tableSchema:string;
	tableName:string;
	columnName:string;
	ordinalPosition:number;
	positionInUniqueConstraint:number|null;
}

export interface DbIndexDescriber{
	schemaname:string;
    tablename:string;
    indexname:string;
    tablespace:null;
    indexdef:string;
}