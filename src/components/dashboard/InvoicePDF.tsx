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
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#333",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        borderBottom: 2,
        borderColor: "#000",
        paddingBottom: 10,
    },
    shopInfo: {
        width: "50%",
    },
    shopName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    shopAddress: {
        fontSize: 9,
        lineHeight: 1.4,
    },
    invoiceInfo: {
        width: "40%",
        textAlign: "right",
    },
    invoiceTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        textTransform: "uppercase",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 3,
    },
    infoLabel: {
        width: "40%",
        color: "#666",
    },
    infoValue: {
        width: "60%",
        fontWeight: "bold",
    },
    table: {
        marginTop: 20,
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#bfbfbf",
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableColHeader: {
        width: "40%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#bfbfbf",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#f0f0f0",
        padding: 5,
    },
    tableColHeaderSmall: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#bfbfbf",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#f0f0f0",
        padding: 5,
        textAlign: "center",
    },
    tableCell: {
        width: "40%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#bfbfbf",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    tableCellSmall: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#bfbfbf",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
        textAlign: "center",
    },
    tableCellRight: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#bfbfbf",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
        textAlign: "right",
    },
    totalSection: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    totalBox: {
        width: "40%",
        borderTop: 2,
        borderColor: "#000",
        paddingTop: 10,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    totalLabel: {
        fontWeight: "bold",
        fontSize: 12,
    },
    totalValue: {
        fontWeight: "bold",
        fontSize: 14,
        color: "#000",
    },
    terbilang: {
        marginTop: 10,
        fontStyle: "italic",
        fontSize: 9,
        color: "#555",
    },
    signatureSection: {
        marginTop: 50,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signatureBox: {
        width: "30%",
        textAlign: "center",
    },
    signatureLine: {
        marginTop: 50,
        borderTop: 1,
        borderColor: "#000",
        paddingTop: 5,
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
        items: OrderItemDetail[];
    };
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
};

export const InvoicePDF = ({ order }: InvoiceProps) => {
    const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>SHOSHA MART</Text>
                        <Text style={styles.shopAddress}>
                            Grand Galaxy City, Ruko RSK 3 No. 19{"\n"}
                            Bekasi Selatan, Kota Bekasi{"\n"}
                            Jawa Barat 17147
                        </Text>
                    </View>
                    <View style={styles.invoiceInfo}>
                        <Text style={styles.invoiceTitle}>Invoice</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>No. Trx: </Text>
                            <Text style={styles.infoValue}>{order.id.slice(0, 8).toUpperCase()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tanggal: </Text>
                            <Text style={styles.infoValue}>{dateStr}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Kepada Yth: </Text>
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
                        <View style={styles.tableColHeaderSmall}><Text>Harga / Satuan</Text></View>
                        <View style={styles.tableColHeaderSmall}><Text>Qty</Text></View>
                        <View style={styles.tableColHeaderSmall}><Text>Subtotal</Text></View>
                    </View>

                    {order.items.map((item, index) => (
                        <View style={styles.tableRow} key={item.id}>
                            <View style={styles.tableCell}>
                                <Text>{item.name}</Text>
                                <Text style={{ fontSize: 8, color: "#666" }}>{item.sku}</Text>
                            </View>
                            <View style={styles.tableCellSmall}>
                                <Text>{formatCurrency(item.price)}</Text>
                                <Text style={{ fontSize: 7 }}>/{item.unit || "Pcs"}</Text>
                            </View>
                            <View style={styles.tableCellSmall}><Text>{item.quantity}</Text></View>
                            <View style={styles.tableCellRight}><Text>{formatCurrency(item.price * item.quantity)}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Total */}
                <View style={styles.totalSection}>
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL BAYAR</Text>
                            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
                        </View>
                        <Text style={styles.terbilang}>
                            Terbilang: # {order.totalAmount.toLocaleString('id-ID')} Rupiah #
                        </Text>
                    </View>
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text>Penerima,</Text>
                        <View style={styles.signatureLine}>
                            <Text>( _________________ )</Text>
                        </View>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text>Hormat Kami,</Text>
                        <View style={styles.signatureLine}>
                            <Text>SHOSHA MART</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
