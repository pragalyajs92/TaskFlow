import os
import pandas as pd
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle
)


def generate_report(
    csv_path,
    output_path,
    report_name="Sales Analysis Report"
):

    # ---------------------------------------
    # 1. READ CSV / EXCEL
    # ---------------------------------------

    file_extension = os.path.splitext(
        csv_path
    )[1].lower()

    if file_extension == ".csv":

        df = pd.read_csv(
            csv_path
        )

    elif file_extension == ".xlsx":

        df = pd.read_excel(
            csv_path,
            engine="openpyxl"
        )

    else:

        raise ValueError(
            "Unsupported file format. "
            "Please upload CSV or XLSX."
        )


    # ---------------------------------------
    # 2. CHECK REQUIRED COLUMNS
    # ---------------------------------------

    required_columns = [
        "Date",
        "Product",
        "Category",
        "Sales",
        "Quantity"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Missing required columns: "
            + ", ".join(missing_columns)
        )


    # ---------------------------------------
    # 3. CONVERT DATE COLUMN
    # ---------------------------------------

    df["Date"] = pd.to_datetime(
        df["Date"],
        dayfirst=True,
        errors="coerce"
    )

    df = df.dropna(
        subset=["Date"]
    )


    # ---------------------------------------
    # 4. BASIC ANALYSIS
    # ---------------------------------------

    total_sales = df["Sales"].sum()

    total_quantity = df["Quantity"].sum()

    average_sales = df["Sales"].mean()


    best_category = (
        df.groupby("Category")["Sales"]
        .sum()
        .idxmax()
    )


    best_product = (
        df.groupby("Product")["Sales"]
        .sum()
        .idxmax()
    )


    # ---------------------------------------
    # 5. CREATE GRAPH DIRECTORY
    # ---------------------------------------

    graph_dir = os.path.dirname(
        output_path
    )

    os.makedirs(
        graph_dir,
        exist_ok=True
    )


    trend_graph = os.path.join(
        graph_dir,
        "sales_trend.png"
    )


    category_graph = os.path.join(
        graph_dir,
        "category_sales.png"
    )


    # ---------------------------------------
    # 6. SALES TREND GRAPH
    # ---------------------------------------

    daily_sales = (
        df.groupby("Date")["Sales"]
        .sum()
    )


    plt.figure(
        figsize=(8, 4)
    )


    plt.plot(
        daily_sales.index,
        daily_sales.values,
        marker="o"
    )


    plt.title(
        "Sales Trend"
    )

    plt.xlabel(
        "Date"
    )

    plt.ylabel(
        "Sales"
    )


    plt.xticks(
        rotation=45
    )


    plt.tight_layout()


    plt.savefig(
        trend_graph
    )


    plt.close()


    # ---------------------------------------
    # 7. CATEGORY SALES GRAPH
    # ---------------------------------------

    category_sales = (
        df.groupby("Category")["Sales"]
        .sum()
        .sort_values(
            ascending=False
        )
    )


    plt.figure(
        figsize=(8, 4)
    )


    category_sales.plot(
        kind="bar"
    )


    plt.title(
        "Sales by Category"
    )

    plt.xlabel(
        "Category"
    )

    plt.ylabel(
        "Sales"
    )


    plt.xticks(
        rotation=0
    )


    plt.tight_layout()


    plt.savefig(
        category_graph
    )


    plt.close()


    # ---------------------------------------
    # 8. CREATE PDF
    # ---------------------------------------

    document = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )


    styles = getSampleStyleSheet()

    story = []


    # ---------------------------------------
    # 9. TITLE
    # ---------------------------------------

    story.append(
        Paragraph(
            report_name,
            styles["Title"]
        )
    )


    story.append(
        Spacer(
            1,
            20
        )
    )


    story.append(
        Paragraph(
            "Generated automatically by TaskFlow",
            styles["Normal"]
        )
    )


    story.append(
        Spacer(
            1,
            25
        )
    )


    # ---------------------------------------
    # 10. SUMMARY
    # ---------------------------------------

    story.append(
        Paragraph(
            "Summary Statistics",
            styles["Heading2"]
        )
    )


    story.append(
        Spacer(
            1,
            10
        )
    )


    summary_data = [
        ["Metric", "Value"],
        [
            "Total Sales",
            f"₹{total_sales:,.2f}"
        ],
        [
            "Total Quantity",
            f"{total_quantity:,}"
        ],
        [
            "Average Sale",
            f"₹{average_sales:,.2f}"
        ],
        [
            "Best Category",
            best_category
        ],
        [
            "Best Product",
            best_product
        ]
    ]


    table = Table(
        summary_data,
        colWidths=[
            3 * inch,
            3 * inch
        ]
    )


    table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.lightgrey
            ),

            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.black
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                1,
                colors.grey
            ),

            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "CENTER"
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, 0),
                10
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, 0),
                10
            )
        ])
    )


    story.append(
        table
    )


    story.append(
        Spacer(
            1,
            30
        )
    )


    # ---------------------------------------
    # 11. SALES TREND
    # ---------------------------------------

    story.append(
        Paragraph(
            "Sales Trend",
            styles["Heading2"]
        )
    )


    story.append(
        Spacer(
            1,
            10
        )
    )


    story.append(
        Image(
            trend_graph,
            width=6.5 * inch,
            height=3.2 * inch
        )
    )


    story.append(
        Spacer(
            1,
            20
        )
    )


    # ---------------------------------------
    # 12. CATEGORY ANALYSIS
    # ---------------------------------------

    story.append(
        Paragraph(
            "Category Analysis",
            styles["Heading2"]
        )
    )


    story.append(
        Spacer(
            1,
            10
        )
    )


    story.append(
        Image(
            category_graph,
            width=6.5 * inch,
            height=3.2 * inch
        )
    )


    # ---------------------------------------
    # 13. BUILD PDF
    # ---------------------------------------

    document.build(
        story
    )


    print(
        "Report generated successfully!"
    )


    print(
        "PDF saved to:",
        output_path
    )