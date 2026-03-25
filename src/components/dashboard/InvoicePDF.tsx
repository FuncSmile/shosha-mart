/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    Font,
} from "@react-pdf/renderer";

// Register fonts if needed, for now we use standard
const PAPER_SIZES = {
    full: [684, 792], // 9.5 x 11 in (Full)
    half: [684, 396], // 9.5 x 5.5 in (Half - Dot Matrix)
    folio: [595.28, 935.43], // 21 x 33 cm (Folio/F4)
    large: [1065.6, 792], // 14.8 x 11 in (Large)
};

// Register fonts if needed, for now we use standard
const styles = StyleSheet.create({
    page: {
        paddingTop: 10, // Reduced vertical padding to save space
        paddingHorizontal: 40, // Increased to avoid cut-off on Dot Matrix printers (accounting for holes)
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#000",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "flex-start",
        marginBottom: 4,
        borderBottomWidth: 1,
        borderColor: "#000",
        paddingBottom: 3,
    },
    shopInfo: {
        width: "32%",
    },
    shopName: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 1,
    },
    shopAddress: {
        fontSize: 9,
        lineHeight: 1.1,
    },
    invoiceTitleContainer: {
        width: "36%",
        textAlign: "center",
        justifyContent: "center",
        paddingTop: 2,
    },
    invoiceTitle: {
        fontSize: 14,
        fontWeight: "bold",
        textTransform: "uppercase",
        textDecoration: "underline",
    },
    invoiceInfo: {
        width: "30%",
        textAlign: "right",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 2,
    },
    infoLabel: {
        width: "40%",
        color: "#333",
        fontSize: 9,
    },
    infoValue: {
        width: "60%",
        fontWeight: "bold",
        fontSize: 9,
    },
    table: {
        marginTop: 2,
        width: "100%", // Explicit full width
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: "row",
        width: "100%",
    },
    tableColHeader: {
        width: "45%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#f9f9f9",
        padding: 2,
    },
    tableColHeaderPrice: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#f9f9f9",
        padding: 2,
        textAlign: "center",
    },
    tableColHeaderQty: {
        width: "10%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#f9f9f9",
        padding: 2,
        textAlign: "center",
    },
    tableColHeaderSubtotal: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#f9f9f9",
        padding: 2,
        textAlign: "center",
    },
    tableCell: {
        width: "45%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 2,
    },
    tableCellPrice: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 2,
        textAlign: "center",
    },
    tableCellQty: {
        width: "10%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 2,
        textAlign: "center",
    },
    tableCellSubtotal: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 2,
        textAlign: "right",
    },
    footerSection: {
        marginTop: 4,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    totalBox: {
        width: "35%",
        borderTopWidth: 1,
        borderColor: "#000",
        paddingTop: 3,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    totalLabel: {
        fontWeight: "bold",
        fontSize: 10,
    },
    totalValue: {
        fontWeight: "bold",
        fontSize: 12,
        color: "#000",
    },
    terbilang: {
        marginTop: 1,
        fontStyle: "italic",
        fontSize: 9,
        color: "#333",
        textAlign: "right",
    },
    signatureBox: {
        width: "25%",
        textAlign: "center",
        fontSize: 10,
    },
    signatureLabel: {
        marginBottom: 15,
    },
    signatureLine: {
        borderTopWidth: 1,
        borderColor: "#000",
        paddingTop: 2,
    }
});

import { OrderItemDetail } from "./OrderDetail";

type InvoiceProps = {
    order: {
        id: string;
        totalAmount: number;
        buyerName: string | null;
        branchName?: string | null;
        tierName?: string;
        createdAt?: Date | string | number | null;
        buyerNote?: string | null;
        items: OrderItemDetail[];
    };
    paperSize?: 'full' | 'half' | 'large';
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
    }).format(amount);
};

export const InvoicePDF = ({ order, paperSize = 'full' }: InvoiceProps) => {
    const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' });

    const size = PAPER_SIZES[paperSize] as any;

    return (
        <Document>
            <Page size={size} style={styles.page}>
                {/* Header: 3 Columns */}
                <View style={styles.header}>
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>ShoshaMart</Text>
                        <Text style={styles.shopAddress}>
                            Jl. Pahlawan No.33, RT.10/RW.4{"\n"}
                            Sukabumi Selatan, Kec. Kb. Jeruk,{"\n"}
                            Kota Jakarta Barat, DKI Jakarta 11560
                        </Text>
                    </View>

                    <View style={styles.invoiceTitleContainer}>
                        <Text style={styles.invoiceTitle}>Invoice</Text>
                    </View>

                    <View style={styles.invoiceInfo}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>No. Trx: </Text>
                            <Text style={styles.infoValue}>{order.id.slice(0, 8).toUpperCase()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tanggal: </Text>
                            <Text style={styles.infoValue}>{dateStr}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Kepada: </Text>
                            <Text style={styles.infoValue}>{order.buyerName || "-"}</Text>
                        </View>
                        {order.branchName && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Cabang: </Text>
                                <Text style={styles.infoValue}>{order.branchName}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={styles.tableColHeader}><Text>Nama Barang (SKU)</Text></View>
                        <View style={styles.tableColHeaderPrice}><Text>Harga/Satuan</Text></View>
                        <View style={styles.tableColHeaderQty}><Text>Qty</Text></View>
                        <View style={styles.tableColHeaderSubtotal}><Text>Subtotal</Text></View>
                    </View>

                    {order.items.map((item, index) => (
                        <View style={styles.tableRow} key={item.id} wrap={false}>
                            <View style={styles.tableCell}>
                                <Text style={{ fontSize: 9, fontWeight: "bold" }}>{item.name}</Text>
                                <Text style={{ fontSize: 7, color: "#333" }}>{item.sku}</Text>
                            </View>
                            <View style={styles.tableCellPrice}>
                                <Text style={{ fontSize: 9 }}>{formatCurrency(item.price)}/{item.unit || "Pcs"}</Text>
                            </View>
                            <View style={styles.tableCellQty}><Text style={{ fontSize: 9 }}>{item.quantity}</Text></View>
                            <View style={styles.tableCellSubtotal}><Text style={{ fontSize: 9, fontWeight: "bold" }}>{formatCurrency(item.price * item.quantity)}</Text></View>
                        </View>
                    ))}
                </View>
                
                {/* Buyer Note if exists */}
                {order.buyerNote && (
                    <View style={{ marginTop: 5, padding: 5, backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#000", borderStyle: "dashed" }}>
                        <Text style={{ fontSize: 8, fontStyle: "italic" }}>
                            Catatan Buyer: {order.buyerNote}
                        </Text>
                    </View>
                )}

                {/* Footer: Signatures + Total in One Row */}
                <View style={styles.footerSection} wrap={false}>
                    {/* Signatures */}
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Penerima,</Text>
                        <View style={styles.signatureLine}>
                            <Text>( ____________ )</Text>
                        </View>
                    </View>

                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Hormat Kami,</Text>
                        <View style={styles.signatureLine}>
                            <Text>ShoshaMart</Text>
                        </View>
                    </View>

                    {/* Total Box */}
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalValue}>Rp {formatCurrency(order.totalAmount)}</Text>
                        </View>
                        <Text style={styles.terbilang}>
                            # {order.totalAmount.toLocaleString('id-ID')} Rupiah #
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

